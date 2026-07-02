CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  parent_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  tone tone_variant NOT NULL DEFAULT 'default',
  push_to_shopify boolean NOT NULL DEFAULT true,
  total_count integer NOT NULL DEFAULT 1,
  completed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_message text,
  bull_queue_name text,
  bull_job_id text,
  idempotency_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_shop_created_at_desc
  ON jobs (shop_id, created_at DESC);

CREATE INDEX idx_jobs_active_status
  ON jobs (status)
  WHERE status IN ('pending', 'processing');

CREATE INDEX idx_jobs_parent_job_id
  ON jobs (parent_job_id);