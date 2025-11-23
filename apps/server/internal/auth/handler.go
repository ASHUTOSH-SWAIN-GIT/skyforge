package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/ASHUTOSH-SWAIN-GIT/DbAlly/server/internal/database"
)

type Handler struct {
	DB *database.Queries
}

func NewHandler(db *database.Queries) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	state := generateState()

	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Expires:  time.Now().Add(10 * time.Minute),
		HttpOnly: true,
		Secure:   true,
	})

	config := NewGoogleConfig()
	url := config.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *Handler) GoogleCallback(w http.ResponseWriter, r *http.Request) {

	// verify the state
	cookie, err := r.Cookie("oauth_state")
	if err != nil || r.FormValue("state") != cookie.Value {
		http.Error(w, "Invalid Oauth state", http.StatusBadRequest)
		return
	}

	// exchange code for token
	code := r.FormValue("code")
	token, err := NewGoogleConfig().Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token ", http.StatusInternalServerError)
		return
	}

	client := NewGoogleConfig().Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, "Failed to fetch user info ", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		http.Error(w, "Failed to decode user info", http.StatusInternalServerError)
		return
	}

	user, err := h.DB.CreateOrUpdateUser(r.Context(), database.CreateOrUpdateUserParams{
		Email:     googleUser.Email,
		Name:      googleUser.Name,
		AvatarUrl: sql.NullString{String: googleUser.Picture, Valid: googleUser.Picture != ""},
		Provider:  "google",
	})
	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to save user", http.StatusInternalServerError)
		return
	}

	// generate jwt token for the session
	jwtToken, err := GenerateJWT(user.ID.String())
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	// set the token in the cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    jwtToken,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Secure:   false, //set true in prod
	})

	http.Redirect(w, r, "http//localhost:3000/dashboard", http.StatusSeeOther)
}

func generateState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
