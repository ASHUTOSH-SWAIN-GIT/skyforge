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