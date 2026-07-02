CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE job_type AS ENUM ('single', 'batch', 'sync');

CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'partial');

CREATE TYPE job_result_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE tone_variant AS ENUM ('default', 'premium', 'casual', 'luxury');

CREATE TYPE shopify_push_status AS ENUM ('pending', 'pushed', 'failed', 'skipped');