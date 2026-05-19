-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "provider" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- projects
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "last_saved_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- project_collaborators
CREATE TABLE "project_collaborators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "project_collaborators_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_collaborators_project_id_user_id_key"
    ON "project_collaborators"("project_id", "user_id");
CREATE INDEX "project_collaborators_project_id_idx" ON "project_collaborators"("project_id");
CREATE INDEX "project_collaborators_user_id_idx" ON "project_collaborators"("user_id");
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- project_share_links
CREATE TABLE "project_share_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "room_key" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(6),
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    "last_used_at" TIMESTAMP(6),
    CONSTRAINT "project_share_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_share_links_token_key" ON "project_share_links"("token");
CREATE UNIQUE INDEX "project_share_links_room_key_key" ON "project_share_links"("room_key");
CREATE INDEX "project_share_links_project_id_idx" ON "project_share_links"("project_id");
ALTER TABLE "project_share_links" ADD CONSTRAINT "project_share_links_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_share_links" ADD CONSTRAINT "project_share_links_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- database_connections
CREATE TABLE "database_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 5432,
    "database_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "db_type" TEXT NOT NULL DEFAULT 'postgres',
    "ssl_mode" TEXT NOT NULL DEFAULT 'require',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "database_connections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "database_connections_user_id_idx" ON "database_connections"("user_id");
CREATE INDEX "database_connections_project_id_idx" ON "database_connections"("project_id");
ALTER TABLE "database_connections" ADD CONSTRAINT "database_connections_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "database_connections" ADD CONSTRAINT "database_connections_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
