import { Link, useParams } from 'react-router-dom';
import { useJobPolling } from '../hooks/useJobPolling';

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function resultStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Waiting';
    case 'processing':
      return 'Optimizing…';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return statusLabel(status);
  }
}


function pushStatusLabel(status: string | undefined): string | null {
  if (!status) return null;
  switch (status) {
    case 'pending':
      return 'Push pending';
    case 'pushed':
      return 'Pushed to Shopify';
    case 'failed':
      return 'Push failed';
    case 'skipped':
      return 'Not pushed';
    default:
      return status;
  }
}

export function JobDetailPage() {
  const { id } = useParams();
  const { job, error, isTerminal, isPolling } = useJobPolling(id);
  

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
    <div>
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        {job.type === 'batch' ? 'Batch optimization' : 'Optimization job'}
      </h1>
      <p className="mt-1 font-mono text-sm text-slate-500">{id}</p>

      {job.type === 'batch' && (
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
            <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-medium text-slate-800">
              {statusLabel(job.status)}
            </span>
            <span className="text-sm text-slate-600">
              Progress: {job.progressPercent}%
            </span>
            {isPolling && (
              <span className="text-sm text-slate-500">Updating…</span>
            )}
            {isTerminal && !isPolling && (
              <span className="text-sm text-slate-500">Finished polling</span>
            )}
          </div>

          {/* Simple progress bar */}
          <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${job.progressPercent}%` }}
            />
          </div>

          {job.status === 'failed' && job.errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {job.errorMessage}
            </p>
          )}


          {job.status === 'partial' && (
            <p className="text-sm text-amber-800" role="status">
              Some products failed. Completed ones still have compare links below.
            </p>
          )}
          {job.status === 'failed' && (
            <p className="text-sm text-red-600" role="alert">
              {job.errorMessage ??
                'All products in this batch failed. See details per product below.'}
            </p>
          )}

          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {job.results.map((result) => (
              <li key={result.jobResultId} className="p-4">
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {result.productTitle}
                    </p>
                    <p className="text-sm text-slate-600">
                      {resultStatusLabel(result.status)}
                      {pushStatusLabel(result.shopifyPushStatus) && (
                        <p className="text-sm text-slate-500">
                          {pushStatusLabel(result.shopifyPushStatus)}
                        </p>
                      )}
                    </p>
                    {result.errorMessage && (
                      <p className="mt-1 text-sm text-red-600">
                        {result.errorMessage}
                      </p>
                    )}
                    {result.usedFallback === true && (
                      <p className="mt-1 text-sm text-amber-700">
                        Fallback output was used — review carefully.
                      </p>
                    )}
                  </div>

                  {result.status === 'completed' && result.compareUrl && (
                    <Link
                      to={result.compareUrl}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      View compare
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}