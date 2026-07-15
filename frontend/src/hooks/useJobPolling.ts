import { useEffect, useState } from 'react';
import { ApiError, getJob } from '../lib/api';
import type { JobStatus, JobStatusResponse } from '../types';

const TERMINAL: JobStatus[] = ['completed', 'failed', 'partial'];

function isTerminalStatus(status: JobStatus): boolean {
  return TERMINAL.includes(status);
}

export function useJobPolling(
  jobId: string | undefined,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
  },
): {
  job: JobStatusResponse | null;
  error: string | null;
  isTerminal: boolean;
  isPolling: boolean;
} {
  const intervalMs = options?.intervalMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 10 * 60 * 1000;

  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTerminal, setIsTerminal] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      setIsTerminal(false);
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startedAt = Date.now();

    setIsPolling(true);
    setError(null);
    setIsTerminal(false);

    async function tick() {
      if (cancelled || !jobId) return;

      if (Date.now() - startedAt > timeoutMs) {
        setError('Timed out waiting for job to finish');
        setIsPolling(false);
        setIsTerminal(true);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      try {
        const next = await getJob(jobId);
        if (cancelled) return;

        setJob(next);
        setError(null);

        if (isTerminalStatus(next.status)) {
          setIsTerminal(true);
          setIsPolling(false);
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load job status',
        );
        // Keep polling on transient errors, or stop — your choice.
        // Stopping on 404 is usually right:
        if (err instanceof ApiError && err.status === 404) {
          setIsPolling(false);
          setIsTerminal(true);
          if (intervalId) clearInterval(intervalId);
        }
      }
    }

    // Immediate first fetch, then every intervalMs
    void tick();
    intervalId = setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, intervalMs, timeoutMs]);

  return { job, error, isTerminal, isPolling };
}