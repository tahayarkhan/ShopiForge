CREATE TABLE job_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status job_result_status NOT NULL DEFAULT 'pending',
  input_snapshot jsonb NOT NULL,
  raw_ai_output text,
  output jsonb,
  validation_errors jsonb,
  shopify_push_status shopify_push_status NOT NULL DEFAULT 'pending',
  shopify_push_error text,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  processing_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_job_results_job_product UNIQUE (job_id, product_id)
);

CREATE INDEX idx_job_results_job_id
  ON job_results (job_id);

CREATE INDEX idx_job_results_product_created_at_desc
  ON job_results (product_id, created_at DESC);