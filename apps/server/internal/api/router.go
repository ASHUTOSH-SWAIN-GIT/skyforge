package api

import (
	"net/http"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/auth"
)

func NewRouter(authHandler *auth.Handler, projectHandler *ProjectHandler, hub *CollaborationHub) http.Handler {
	mux := http.NewServeMux()

	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}

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
	mux.HandleFunc("DELETE /projects/{id}", projectHandler.DeleteProject)

	mux.HandleFunc("GET /projects/{id}/export", projectHandler.ExportProjectSQL)
	mux.HandleFunc("GET /projects/{id}/export/prisma", projectHandler.ExportProjectPrisma)
	mux.HandleFunc("POST /projects/{id}/import-sql", projectHandler.ImportSQL)
	mux.HandleFunc("POST /projects/{id}/ai/generate-tables", projectHandler.AIGenerateTables)
	mux.HandleFunc("GET /projects/{id}/share-link", projectHandler.GetShareLink)
	mux.HandleFunc("POST /projects/{id}/share-link", projectHandler.CreateShareLink)
	mux.HandleFunc("POST /projects/share-links/{token}/join", projectHandler.JoinShareLink)
	mux.HandleFunc("GET /projects/{id}/collaborators", projectHandler.GetProjectCollaborators)

	// WebSocket Routes for Collaboration
	mux.HandleFunc("/ws/collaboration/", hub.HandleWebSocket)

	// Health check endpoint - can be hit by cron job to keep server alive
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-cache")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Ping endpoint - lightweight endpoint for cron jobs/uptime monitors
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		w.Write([]byte("pong"))
	})

	return corsMiddleware(mux)
}
