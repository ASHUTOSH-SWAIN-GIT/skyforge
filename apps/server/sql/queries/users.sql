-- name: CreateUser :one
INSERT INTO users (email, name, avatar_url, provider)
VALUES ($1, $2, $3, $4)
ON CONFLICT (email) DO UPDATE
SET name = $2, avatar_url = $3, updated_at = NOW()
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;