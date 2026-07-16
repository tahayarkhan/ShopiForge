-- Phase 5: atomic parent counter increments + terminal status finalize

CREATE OR REPLACE FUNCTION finalize_batch_parent_status(p_job_id uuid)
RETURNS jobs
LANGUAGE plpgsql
AS $$
DECLARE
  updated jobs;
  done integer;
BEGIN
  SELECT * INTO updated FROM jobs WHERE id = p_job_id;

  IF updated.id IS NULL THEN
    RAISE EXCEPTION 'Job % not found', p_job_id;
  END IF;

  done := updated.completed_count + updated.failed_count;

  -- Not finished yet — leave status alone (usually processing)
  IF done < updated.total_count THEN
    RETURN updated;
  END IF;

  -- All children accounted for → set terminal status
  IF updated.failed_count = 0 THEN
    UPDATE jobs
    SET status = 'completed',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    WHERE id = p_job_id
    RETURNING * INTO updated;
  ELSIF updated.completed_count = 0 THEN
    UPDATE jobs
    SET status = 'failed',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    WHERE id = p_job_id
    RETURNING * INTO updated;
  ELSE
    UPDATE jobs
    SET status = 'partial',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    WHERE id = p_job_id
    RETURNING * INTO updated;
  END IF;

  RETURN updated;
END;
$$;

CREATE OR REPLACE FUNCTION increment_job_completed_count(p_job_id uuid)
RETURNS jobs
LANGUAGE plpgsql
AS $$
DECLARE
  updated jobs;
BEGIN
  UPDATE jobs
  SET completed_count = completed_count + 1,
      updated_at = now()
  WHERE id = p_job_id
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN
    RAISE EXCEPTION 'Job % not found', p_job_id;
  END IF;

  RETURN finalize_batch_parent_status(p_job_id);
END;
$$;

CREATE OR REPLACE FUNCTION increment_job_failed_count(p_job_id uuid)
RETURNS jobs
LANGUAGE plpgsql
AS $$
DECLARE
  updated jobs;
BEGIN
  UPDATE jobs
  SET failed_count = failed_count + 1,
      updated_at = now()
  WHERE id = p_job_id
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN
    RAISE EXCEPTION 'Job % not found', p_job_id;
  END IF;

  RETURN finalize_batch_parent_status(p_job_id);
END;
$$;

-- Optional helper: pending → processing only once (first child wins)
CREATE OR REPLACE FUNCTION mark_job_processing_if_pending(p_job_id uuid)
RETURNS jobs
LANGUAGE plpgsql
AS $$
DECLARE
  updated jobs;
BEGIN
  UPDATE jobs
  SET status = 'processing',
      started_at = coalesce(started_at, now()),
      updated_at = now()
  WHERE id = p_job_id
    AND status = 'pending'
  RETURNING * INTO updated;

  -- If already processing/completed, return current row (no error)
  IF updated.id IS NULL THEN
    SELECT * INTO updated FROM jobs WHERE id = p_job_id;
  END IF;

  RETURN updated;
END;
$$;