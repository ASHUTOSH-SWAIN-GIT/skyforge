package api

import (
	"net/http"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/auth"
)

func NewRouter(authHandler *auth.Handler, projectHandler *ProjectHandler) *http.ServeMux {
	mux := http.NewServeMux()

	// Auth Routes
	mux.HandleFunc("/auth/google/login", authHandler.GoogleLogin)
	mux.HandleFunc("/auth/google/callback", authHandler.GoogleCallback)
	mux.HandleFunc("/auth/me", authHandler.GetMe)

	// Project Routes
	mux.HandleFunc("/projects", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			projectHandler.CreateProject(w, r)
		case http.MethodGet:
			projectHandler.GetMyProjects(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	return mux
}
