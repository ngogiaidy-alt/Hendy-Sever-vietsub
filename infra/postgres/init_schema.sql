-- ==============================================================================
-- Hendy-Server Database Schema
-- File: infra/postgres/init_schema.sql
-- Relational storage for GitHub Users, Repositories, Deployments, Logs & Media Nodes
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (GitHub OAuth & System Accounts)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    login VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    html_url TEXT,
    public_repos INT DEFAULT 0,
    followers INT DEFAULT 0,
    token_encrypted TEXT,
    token_type VARCHAR(32) DEFAULT 'oauth',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Repositories Table
CREATE TABLE IF NOT EXISTS repositories (
    id BIGINT PRIMARY KEY,
    owner_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    default_branch VARCHAR(64) DEFAULT 'main',
    language VARCHAR(64),
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    webhook_configured BOOLEAN DEFAULT FALSE,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Deployments & Builds Table
CREATE TABLE IF NOT EXISTS deployments (
    id VARCHAR(64) PRIMARY KEY,
    repo_id BIGINT REFERENCES repositories(id) ON DELETE CASCADE,
    repo_full_name VARCHAR(255) NOT NULL,
    branch VARCHAR(64) NOT NULL,
    commit_hash VARCHAR(40) NOT NULL,
    commit_message TEXT,
    author VARCHAR(120),
    status VARCHAR(32) NOT NULL DEFAULT 'queued', -- queued, building, deploying, healthy, failed, rolled_back
    environment VARCHAR(32) DEFAULT 'production', -- production, staging, worker-node
    version VARCHAR(32),
    preview_url TEXT,
    duration_ms INT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    cpu_percent NUMERIC(5,2),
    memory_mb INT,
    latency_ms NUMERIC(6,2),
    rps INT
);

-- 4. Build Logs Table (Streaming Console Outputs)
CREATE TABLE IF NOT EXISTS build_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id VARCHAR(64) NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    stage VARCHAR(32) NOT NULL, -- clone, deps, build, test, docker, deploy
    level VARCHAR(16) NOT NULL DEFAULT 'info', -- info, warn, error, success, cmd
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Webhook Logs Table (X-Hub-Signature-256 Audits)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id VARCHAR(64) PRIMARY KEY,
    event VARCHAR(64) NOT NULL,
    delivery_id VARCHAR(128) NOT NULL,
    signature VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    repo_full_name VARCHAR(255),
    sender VARCHAR(120),
    summary TEXT,
    payload JSONB,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Media Stream Channels (VIETSUB PRO - 20 Tabs Ingest)
CREATE TABLE IF NOT EXISTS media_streams (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    channel_url TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'idle', -- idle, streaming, transcribing, ducking_active
    viewers INT DEFAULT 0,
    fps INT DEFAULT 60,
    bitrate_kbps INT DEFAULT 4500,
    whisper_model VARCHAR(32) DEFAULT 'large-v3',
    source_language VARCHAR(10) DEFAULT 'auto',
    target_language VARCHAR(10) DEFAULT 'vi',
    ducking_enabled BOOLEAN DEFAULT TRUE,
    attenuation_db NUMERIC(4,1) DEFAULT -14.0,
    threshold_db NUMERIC(4,1) DEFAULT -22.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Transcription Records (Bóc băng & Dịch thuật tự động)
CREATE TABLE IF NOT EXISTS transcription_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id VARCHAR(64) REFERENCES media_streams(id) ON DELETE CASCADE,
    speaker VARCHAR(120),
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 0.98,
    start_time NUMERIC(8,2),
    end_time NUMERIC(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_deployments_repo ON deployments(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_build_logs_deployment ON build_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_stream ON transcription_jobs(stream_id);
