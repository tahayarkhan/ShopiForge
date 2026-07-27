import { Link, useParams } from 'react-router-dom';
import { useJobPolling } from '../hooks/useJobPolling';
import { StatusChip } from '../components/StatusChip';
import { useEffect, useState } from 'react';



function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}


function useElapsedLabel(
  startedAt: string | null | undefined,
  createdAt: string | undefined,
  completedAt: string | null | undefined,
  isTerminal: boolean,
): string {
  const originIso = startedAt ?? createdAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (isTerminal || !originIso) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isTerminal, originIso]);
  if (!originIso) return '—';
  const startMs = new Date(originIso).getTime();
  if (isTerminal) {
    const endIso = completedAt ?? new Date().toISOString();
    return formatDuration(new Date(endIso).getTime() - startMs);
  }
  return formatDuration(now - startMs);
}


export function JobDetailPage() {
  const { id } = useParams();
  const { job, error, isTerminal, isPolling } = useJobPolling(id);
  const total = Math.max(job?.totalCount ?? 1, 1);
  const completedPct = job ? (job.completedCount / total) * 100 : 0;
  const failedPct = job ? (job.failedCount / total) * 100 : 0;
  const elapsed = useElapsedLabel(
    job?.startedAt,
    job?.createdAt,
    job?.completedAt,
    isTerminal,
  );

  if (!id) {
    return (
      <div>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
        <p className="mt-4 text-red-600">Missing job id</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mt-6 space-y-4">
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        {job?.type === 'batch' ? 'Batch optimization' : 'Optimization job'}
      </h1>

      <p className="mt-1 font-mono text-sm text-slate-500">{id}</p>

      {job?.type === 'batch' && (
        <p className="mt-2 text-sm text-slate-600">
          {job.completedCount} completed · {job.failedCount} failed ·{' '}
          {job.totalCount} total
        </p>
      )}


      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!job && !error && (
        <p className="mt-4 text-sm text-slate-600">Loading job status…</p>
      )}



      {job && (
        <div className="mt-6 space-y-4">



          <div className="flex flex-wrap items-center gap-3">
             {/* Header badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-(--color-ink)/8 px-2.5 py-0.5 text-xs font-medium capitalize text-(--color-ink)">
                {job.type}
              </span>
              <span className="rounded-full bg-(--color-ink)/8 px-2.5 py-0.5 text-xs font-medium capitalize text-(--color-muted)">
                Tone: {job.tone}
              </span>
              <StatusChip status={job.status} />
              <span className="text-sm text-slate-600">
              Progress: {job.progressPercent}%
              </span>
              {isPolling && (
                <span className="text-sm text-(--color-muted)">Updating…</span>
              )}
              {isTerminal && !isPolling && (
                <span className="text-sm text-(--color-muted)">Finished</span>
              )}
              <p className="text-sm text-(--color-muted)">
                {isTerminal ? 'Duration' : 'Elapsed'}:{' '}
                <span className="font-medium text-(--color-ink)">{elapsed}</span>
              </p>
            </div>
          </div>

          {/* progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-(--color-muted)">
              <span>
                {job.completedCount} completed · {job.failedCount} failed ·{' '}
                {job.totalCount} total
              </span>
              <span className="font-medium text-(--color-ink)">
                {job.progressPercent}%
              </span>
            </div>

            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-(--color-ink)/10"
              role="progressbar"
              aria-valuenow={job.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-(--color-mint) transition-all duration-500"
                style={{ width: `${completedPct}%` }}
              />
              <div
                className="h-full bg-(--color-danger) transition-all duration-500"
                style={{ width: `${failedPct}%` }}
              />
            </div>
          </div>

          

          {isTerminal && job.status === 'completed' && (
            <div
              className="animate-fade-in rounded-lg border border-(--color-mint)/30 bg-(--color-mint)/10 px-4 py-3 text-sm text-(--color-mint)"
              role="status"
            >
              Job completed successfully.
            </div>
          )}

          {isTerminal && job.status === 'partial' && (
            <div
              className="animate-fade-in rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800"
              role="status"
            >
              Finished with issues: {job.failedCount} failed of {job.totalCount}.
              {job.errorMessage ? ` ${job.errorMessage}` : ''}{' '}
              Completed products still have compare links below.
            </div>
          )}

          {isTerminal && job.status === 'failed' && (
            <div
              className="animate-fade-in rounded-lg border border-(--color-danger)/30 bg-(--color-danger)/10 px-4 py-3 text-sm text-(--color-danger)"
              role="alert"
            >
              {job.errorMessage ??
                `All ${job.failedCount} product(s) failed. See details per row.`}
            </div>
          )}

          <ul className="divide-y divide-(--color-ink)/10 rounded-lg border border-(--color-ink)/10 bg-(--color-paper)">
            {job.results.map((result) => {
              const isProcessing = result.status === 'processing';

              return (
                <li
                  key={result.jobResultId}
                  className={[
                    'p-4 transition-opacity',
                    isProcessing ? 'animate-pulse-soft' : '',
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <p className="font-medium text-(--color-ink)">
                        {result.productTitle}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        <StatusChip status={result.status} />

                        {result.shopifyPushStatus && (
                          <StatusChip
                            status={result.shopifyPushStatus}
                            label={`Push: ${result.shopifyPushStatus}`}
                          />
                        )}

                        {result.usedFallback === true && (
                          <StatusChip status="usedFallback" label="Fallback used" />
                        )}
                      </div>

                      {result.errorMessage && (
                        <p className="text-sm text-(--color-danger)">
                          {result.errorMessage}
                        </p>
                      )}
                    </div>

                    {result.compareUrl && (
                      <Link
                        to={result.compareUrl}
                        className="rounded-md bg-(--color-forge) px-3 py-1.5 text-sm font-medium text-(--color-paper) hover:bg-(--color-forge-hover)"
                      >
                        View compare
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}