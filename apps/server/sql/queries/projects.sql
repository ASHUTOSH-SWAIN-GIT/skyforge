-- name: CreateProject :one
INSERT INTO projects (user_id, name, description, data)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetProjectsByUser :many
SELECT p.id, p.name, p.description, p.is_public, p.last_saved_at, p.created_at, 'owner' as role
FROM projects p
WHERE p.user_id = $1
UNION ALL
SELECT p.id, p.name, p.description, p.is_public, p.last_saved_at, p.created_at, pc.role
FROM projects p
JOIN project_collaborators pc ON p.id = pc.project_id
WHERE pc.user_id = $1
ORDER BY last_saved_at DESC;

-- name: AddProjectCollaborator :exec
INSERT INTO project_collaborators (project_id, user_id, role)
VALUES ($1, $2, $3);

-- name: GetProjectByID :one
SELECT * FROM projects WHERE id = $1;

-- name: UpdateProject :one
UPDATE projects 
SET name = $2,
    description = $3,
    data = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateProjectData :one
UPDATE projects
SET data = $2,
    updated_at = NOW(),
    last_saved_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1 AND user_id = $2;

-- name: GetProjectCollaborator :one
SELECT id, project_id, user_id, role, created_at
FROM project_collaborators
WHERE project_id = $1 AND user_id = $2;

-- name: UpsertProjectCollaborator :exec
INSERT INTO project_collaborators (project_id, user_id, role)
VALUES ($1, $2, $3)
ON CONFLICT (project_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- name: GetProjectCollaborators :many
SELECT u.id, u.email, u.name, u.avatar_url, u.provider, 'owner' as role, p.created_at
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE p.id = $1
UNION ALL
SELECT u.id, u.email, u.name, u.avatar_url, u.provider, pc.role, pc.created_at
FROM project_collaborators pc
JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = $1;