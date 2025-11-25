-- name: CreateProjectShareLink :one
INSERT INTO project_share_links (project_id, token, room_key, created_by, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetActiveShareLinkForProject :one
SELECT *
FROM project_share_links
WHERE project_id = $1
  AND revoked_at IS NULL
ORDER BY created_at DESC
LIMIT 1;

-- name: GetShareLinkByToken :one
SELECT *
FROM project_share_links
WHERE token = $1
  AND revoked_at IS NULL
LIMIT 1;

-- name: RevokeShareLinksForProject :exec
UPDATE project_share_links
SET revoked_at = NOW()
WHERE project_id = $1
  AND revoked_at IS NULL;

