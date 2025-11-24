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
	mux.HandleFunc("POST /auth/logout", authHandler.Logout)

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
	mux.HandleFunc("GET /projects/{id}", projectHandler.GetProject)
	mux.HandleFunc("PUT /projects/{id}", projectHandler.UpdateProject)

	mux.HandleFunc("GET /projects/{id}/export", projectHandler.ExportProjectSQL)
	mux.HandleFunc("GET /projects/{id}/export/ai", projectHandler.ExportProjectSQL_AI)
	mux.HandleFunc("POST /projects/{id}/import-sql", projectHandler.ImportSQL)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	return mux
}
