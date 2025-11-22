-- +goose Up
-- Enable UUID support (standard for modern apps)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT NOT NULL, -- 'google', 'github', 'email'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. PROJECTS TABLE (Where the Magic Happens)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- THIS IS THE CORE: Stores the React Flow JSON (Nodes & Edges)
    -- We use JSONB for binary storage (faster querying)
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    last_saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- +goose Down
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;