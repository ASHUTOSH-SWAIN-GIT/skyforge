package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/database"
	"github.com/google/uuid"
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

	// Redirect back to frontend dashboard with token in URL
	// The frontend will set it as a cookie on its own domain
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		// Fallback for local development
		frontendURL = "http://localhost:3000"
	}

	// In production, pass token via URL so frontend can set cookie on its domain
	// In local dev, we can set cookie directly since same origin
	if os.Getenv("ENV") == "production" {
		http.Redirect(w, r, frontendURL+"/dashboard?token="+jwtToken, http.StatusSeeOther)
	} else {
		// Local development: set cookie directly since same origin
		http.SetCookie(w, &http.Cookie{
			Name:     "auth_token",
			Value:    jwtToken,
			Expires:  time.Now().Add(7 * 24 * time.Hour),
			HttpOnly: true,
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
			Secure:   false,
		})
		http.Redirect(w, r, frontendURL+"/dashboard", http.StatusSeeOther)
	}
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	// get cookie
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// validate the jwt token
	userIDStr, err := ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// parse UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User id ", http.StatusInternalServerError)
		return
	}

	// fetch user from the db
	user, err := h.DB.GetUserByID(r.Context(), userID)
	if err != nil {
		// Log the error to see if it's DB issue or not found
		fmt.Printf("User not found or DB error: %v\n", err)
		http.Error(w, "user not found ", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// Configure cookie attributes (different for local vs production)
	sameSite := http.SameSiteLaxMode
	secure := false
	if os.Getenv("ENV") == "production" {
		sameSite = http.SameSiteNoneMode
		secure = true
	}

	// Clear the auth_token cookie by setting it to expire in the past
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		Path:     "/",
		SameSite: sameSite,
		Secure:   secure,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func generateState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
