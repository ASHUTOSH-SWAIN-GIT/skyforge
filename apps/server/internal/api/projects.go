package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/ai"
	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/auth"
	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/compiler"
	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/database"
	"github.com/google/uuid"
)

type ProjectHandler struct {
	DB *database.Queries
	AI *ai.AIService
}

func NewProjectHandler(db *database.Queries) *ProjectHandler {
	aiService, _ := ai.NewAIService()
	return &ProjectHandler{
		DB: db,
		AI: aiService,
	}
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

	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Project name is required", http.StatusBadRequest)
		return
	}

	project, err := h.DB.CreateProject(r.Context(), database.CreateProjectParams{
		UserID:      userID,
		Name:        req.Name,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
		Data:        []byte("{}"),
	})
	if err != nil {
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (h *ProjectHandler) GetMyProjects(w http.ResponseWriter, r *http.Request) {
	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

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

	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	project, err := h.DB.GetProjectByID(r.Context(), projectID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if project.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

type UpdateProjectRequest struct {
	Data json.RawMessage `json:"data"`
}

func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var req UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cleanData, err := normalizeCanvasJSON(req.Data)
	if err != nil {
		http.Error(w, "Invalid canvas data", http.StatusBadRequest)
		return
	}

	project, err := h.DB.UpdateProjectData(r.Context(), database.UpdateProjectDataParams{
		ID:     projectID,
		UserID: userID,
		Data:   cleanData,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Project not found or access denied", http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (h *ProjectHandler) ExportProjectSQL(w http.ResponseWriter, r *http.Request) {
	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, _ := uuid.Parse(projectIDStr)

	project, err := h.DB.GetProjectByID(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	if project.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	dataBytes, err := normalizeCanvasJSON(project.Data)
	if err != nil {
		http.Error(w, "Failed to parse project data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if len(dataBytes) == 0 {
		http.Error(w, "Project has no canvas data", http.StatusBadRequest)
		return
	}

	sqlScript, err := compiler.GenerateSQL(dataBytes)
	if err != nil {
		http.Error(w, "Failed to generate SQL: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(sqlScript))
}

func (h *ProjectHandler) ExportProjectSQL_AI(w http.ResponseWriter, r *http.Request) {
	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, _ := uuid.Parse(projectIDStr)

	project, err := h.DB.GetProjectByID(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	if project.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if h.AI == nil {
		http.Error(w, "AI Service not configured (Missing API Key)", http.StatusServiceUnavailable)
		return
	}

	dataBytes, err := normalizeCanvasJSON(project.Data)
	if err != nil {
		http.Error(w, "Failed to parse project data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if len(dataBytes) == 0 {
		http.Error(w, "Project has no canvas data", http.StatusBadRequest)
		return
	}

	sqlScript, err := h.AI.GenerateSQLFromGraph(dataBytes)
	if err != nil {
		http.Error(w, "AI Generation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(sqlScript))
}

func (h *ProjectHandler) ImportSQL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	project, err := h.DB.GetProjectByID(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	if project.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB max
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("sqlFile")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read file content
	sqlContent := make([]byte, header.Size)
	if _, err := file.Read(sqlContent); err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	// Parse SQL and convert to canvas format
	canvasData, err := compiler.ImportSQL(string(sqlContent))
	if err != nil {
		http.Error(w, "Failed to import SQL: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Update project with imported canvas data
	updatedProject, err := h.DB.UpdateProjectData(r.Context(), database.UpdateProjectDataParams{
		ID:     projectID,
		UserID: userID,
		Data:   canvasData,
	})
	if err != nil {
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedProject)
}

func (h *ProjectHandler) authorize(r *http.Request) (uuid.UUID, error) {
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		return uuid.Nil, err
	}
	userIDStr, err := auth.ValidateJWT(cookie.Value)
	if err != nil {
		return uuid.Nil, err
	}
	return uuid.Parse(userIDStr)
}

func normalizeCanvasJSON(raw json.RawMessage) (json.RawMessage, error) {
	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 || bytes.Equal(trimmed, []byte("null")) {
		return nil, nil
	}

	if trimmed[0] == '"' {
		var unquoted string
		if err := json.Unmarshal(trimmed, &unquoted); err != nil {
			return nil, err
		}
		return json.RawMessage([]byte(unquoted)), nil
	}

	out := make([]byte, len(trimmed))
	copy(out, trimmed)
	return json.RawMessage(out), nil
}
