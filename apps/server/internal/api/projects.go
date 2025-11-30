package api

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

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

	project, err := h.getProjectForUser(r.Context(), projectID, userID)
	if err != nil {
		writeProjectAccessError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

type UpdateProjectRequest struct {
	Data json.RawMessage `json:"data"`
}

type shareLinkResponse struct {
	ProjectID uuid.UUID  `json:"project_id"`
	Token     string     `json:"token"`
	RoomKey   string     `json:"room_key"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	CreatedBy uuid.UUID  `json:"created_by"`
}

type createShareLinkRequest struct {
	ExpiresInHours *int `json:"expiresInHours"`
}

type joinShareLinkResponse struct {
	ProjectID   uuid.UUID  `json:"project_id"`
	ProjectName string     `json:"project_name"`
	RoomKey     string     `json:"room_key"`
	Token       string     `json:"token"`
	OwnerID     uuid.UUID  `json:"owner_id"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

var errProjectAccessDenied = errors.New("project access denied")

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

	if _, err := h.getProjectForUser(r.Context(), projectID, userID); err != nil {
		writeProjectAccessError(w, err)
		return
	}

	project, err := h.DB.UpdateProjectData(r.Context(), database.UpdateProjectDataParams{
		ID:   projectID,
		Data: cleanData,
	})
	if err != nil {
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
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

	project, err := h.getProjectForUser(r.Context(), projectID, userID)
	if err != nil {
		writeProjectAccessError(w, err)
		return
	}

	if project.UserID != userID {
		http.Error(w, "Only project owners can delete projects", http.StatusForbidden)
		return
	}

	if err := h.DB.DeleteProject(r.Context(), database.DeleteProjectParams{
		ID:     projectID,
		UserID: userID,
	}); err != nil {
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) ExportProjectSQL(w http.ResponseWriter, r *http.Request) {
	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, _ := uuid.Parse(projectIDStr)

	project, err := h.getProjectForUser(r.Context(), projectID, userID)
	if err != nil {
		writeProjectAccessError(w, err)
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

func (h *ProjectHandler) ExportProjectPrisma(w http.ResponseWriter, r *http.Request) {
	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := r.PathValue("id")
	projectID, _ := uuid.Parse(projectIDStr)

	project, err := h.getProjectForUser(r.Context(), projectID, userID)
	if err != nil {
		writeProjectAccessError(w, err)
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

	prismaSchema, err := compiler.GeneratePrisma(dataBytes)
	if err != nil {
		http.Error(w, "Failed to generate Prisma schema: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(prismaSchema))
}

type AIGenerateTablesRequest struct {
	Prompt string `json:"prompt"`
}

func (h *ProjectHandler) AIGenerateTables(w http.ResponseWriter, r *http.Request) {
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

	// Verify user has access to project
	if _, err := h.getProjectForUser(r.Context(), projectID, userID); err != nil {
		writeProjectAccessError(w, err)
		return
	}

	if h.AI == nil {
		http.Error(w, "AI Service not configured (Missing API Key)", http.StatusServiceUnavailable)
		return
	}

	var req AIGenerateTablesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Prompt) == "" {
		http.Error(w, "Prompt is required", http.StatusBadRequest)
		return
	}

	// Generate tables using AI
	canvasData, err := h.AI.GenerateTablesFromPrompt(req.Prompt)
	if err != nil {
		http.Error(w, "AI Generation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canvasData)
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

	if _, err := h.getProjectForUser(r.Context(), projectID, userID); err != nil {
		writeProjectAccessError(w, err)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB max
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("sqlFile")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read file content
	sqlContent, err := io.ReadAll(file)
	if err != nil {
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
		ID:   projectID,
		Data: canvasData,
	})
	if err != nil {
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedProject)
}

func (h *ProjectHandler) GetShareLink(w http.ResponseWriter, r *http.Request) {
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

	if _, err := h.getProjectForUser(r.Context(), projectID, userID); err != nil {
		writeProjectAccessError(w, err)
		return
	}

	link, err := h.DB.GetActiveShareLinkForProject(r.Context(), projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "No active share link", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load share link", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(makeShareLinkResponse(link))
}

func (h *ProjectHandler) CreateShareLink(w http.ResponseWriter, r *http.Request) {
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

	project, err := h.getProjectForUser(r.Context(), projectID, userID)
	if err != nil {
		writeProjectAccessError(w, err)
		return
	}
	if project.UserID != userID {
		http.Error(w, "Only the project owner can create share links", http.StatusForbidden)
		return
	}

	var req createShareLinkRequest
	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
	}

	var expires sql.NullTime
	if req.ExpiresInHours != nil && *req.ExpiresInHours > 0 {
		expires = sql.NullTime{
			Time:  time.Now().Add(time.Duration(*req.ExpiresInHours) * time.Hour),
			Valid: true,
		}
	}

	if err := h.DB.RevokeShareLinksForProject(r.Context(), projectID); err != nil {
		http.Error(w, "Failed to reset previous share links", http.StatusInternalServerError)
		return
	}

	token := generateCollaborationToken()
	roomKey := generateCollaborationToken()

	link, err := h.DB.CreateProjectShareLink(r.Context(), database.CreateProjectShareLinkParams{
		ProjectID: projectID,
		Token:     token,
		RoomKey:   roomKey,
		CreatedBy: userID,
		ExpiresAt: expires,
	})
	if err != nil {
		http.Error(w, "Failed to create share link", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(makeShareLinkResponse(link))
}

func (h *ProjectHandler) JoinShareLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.authorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	token := r.PathValue("token")
	if token == "" {
		http.Error(w, "Share token is required", http.StatusBadRequest)
		return
	}

	link, err := h.DB.GetShareLinkByToken(r.Context(), token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Share link not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load share link", http.StatusInternalServerError)
		return
	}

	if link.ExpiresAt.Valid && time.Now().After(link.ExpiresAt.Time) {
		_ = h.DB.RevokeShareLinksForProject(r.Context(), link.ProjectID)
		http.Error(w, "Share link expired", http.StatusGone)
		return
	}

	project, err := h.DB.GetProjectByID(r.Context(), link.ProjectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load project", http.StatusInternalServerError)
		return
	}

	if project.UserID != userID {
		if err := h.DB.UpsertProjectCollaborator(r.Context(), database.UpsertProjectCollaboratorParams{
			ProjectID: project.ID,
			UserID:    userID,
			Role:      "editor",
		}); err != nil {
			http.Error(w, "Failed to add collaborator", http.StatusInternalServerError)
			return
		}
	}

	resp := joinShareLinkResponse{
		ProjectID:   project.ID,
		ProjectName: project.Name,
		RoomKey:     link.RoomKey,
		Token:       link.Token,
		OwnerID:     project.UserID,
	}
	if link.ExpiresAt.Valid {
		resp.ExpiresAt = &link.ExpiresAt.Time
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type ProjectCollaboratorResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarUrl *string   `json:"avatar_url"`
	Provider  string    `json:"provider"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *ProjectHandler) GetProjectCollaborators(w http.ResponseWriter, r *http.Request) {
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

	// Verify user has access to this project
	_, err = h.getProjectForUser(r.Context(), projectID, userID)
	if err != nil {
		writeProjectAccessError(w, err)
		return
	}

	// Get all collaborators using sqlc generated query
	collabRows, err := h.DB.GetProjectCollaborators(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Failed to fetch collaborators", http.StatusInternalServerError)
		return
	}

	collaborators := make([]ProjectCollaboratorResponse, 0, len(collabRows))
	for _, row := range collabRows {
		var avatarUrl *string
		if row.AvatarUrl.Valid {
			avatarUrl = &row.AvatarUrl.String
		}
		collaborators = append(collaborators, ProjectCollaboratorResponse{
			ID:        row.ID.String(),
			Email:     row.Email,
			Name:      row.Name,
			AvatarUrl: avatarUrl,
			Provider:  row.Provider,
			Role:      row.Role,
			CreatedAt: row.CreatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collaborators)
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

func (h *ProjectHandler) getProjectForUser(ctx context.Context, projectID, userID uuid.UUID) (database.Project, error) {
	project, err := h.DB.GetProjectByID(ctx, projectID)
	if err != nil {
		return database.Project{}, err
	}

	if project.UserID == userID {
		return project, nil
	}

	_, err = h.DB.GetProjectCollaborator(ctx, database.GetProjectCollaboratorParams{
		ProjectID: projectID,
		UserID:    userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return database.Project{}, errProjectAccessDenied
		}
		return database.Project{}, err
	}
	return project, nil
}

func writeProjectAccessError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, errProjectAccessDenied):
		http.Error(w, "Forbidden", http.StatusForbidden)
	case errors.Is(err, sql.ErrNoRows):
		http.Error(w, "Project not found", http.StatusNotFound)
	default:
		http.Error(w, "Database error", http.StatusInternalServerError)
	}
}

func makeShareLinkResponse(link database.ProjectShareLink) shareLinkResponse {
	var expires *time.Time
	if link.ExpiresAt.Valid {
		expires = &link.ExpiresAt.Time
	}
	return shareLinkResponse{
		ProjectID: link.ProjectID,
		Token:     link.Token,
		RoomKey:   link.RoomKey,
		CreatedAt: link.CreatedAt,
		ExpiresAt: expires,
		CreatedBy: link.CreatedBy,
	}
}

func generateCollaborationToken() string {
	return strings.ReplaceAll(uuid.NewString(), "-", "")
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
