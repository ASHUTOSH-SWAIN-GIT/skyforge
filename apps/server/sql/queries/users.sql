-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: CreateOrUpdateUser :one
INSERT INTO users (email, name, avatar_url, provider, updated_at)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (email) 
DO UPDATE SET 
    name = $2,
    avatar_url = $3,
    updated_at = NOW()
RETURNING *;