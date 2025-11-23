package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/auth"
	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/database"
	"github.com/google/uuid"
)

type ProjectHandler struct {
	DB *database.Queries
}

func NewProjectHandler(db *database.Queries) *ProjectHandler {
	return &ProjectHandler{DB: db}
}

type CreateProjectRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Collaborators []string `json:"collaborators"`
}

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// get userid from the cookie
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userIDStr, err := auth.ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}
	userID, _ := uuid.Parse(userIDStr)

	// parse request body
	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Project name is required", http.StatusBadRequest)
		return
	}

	// Insert the data into the database
	project, err := h.DB.CreateProject(r.Context(), database.CreateProjectParams{
		UserID:      userID,
		Name:        req.Name,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
		Data:        []byte("{}"), // Empty React Flow graph
	})
	if err != nil {
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	// TODO: Handle Collaborators logic here (Requires a 'project_collaborators' table)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (h *ProjectHandler) GetMyProjects(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userIDStr, err := auth.ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}
	userID, _ := uuid.Parse(userIDStr)

	// fetch projects

	projects, err := h.DB.GetProjectsByUser(r.Context(), userID)
	if err != nil {
		http.Error(w, "Failed to fetch projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// get userid from the cookie
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userIDStr, err := auth.ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}
	_, _ = uuid.Parse(userIDStr)

	// get project ID from URL path
	pathParts := strings.TrimPrefix(r.URL.Path, "/projects/")
	if pathParts == "" || pathParts == r.URL.Path {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	// Extract just the project ID (in case there are query params or trailing slashes)
	projectIDStr := strings.Split(pathParts, "/")[0]
	projectIDStr = strings.Split(projectIDStr, "?")[0]

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	// fetch project
	project, err := h.DB.GetProjectByID(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	// TODO: Check if user has access to this project (owner or collaborator)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}
