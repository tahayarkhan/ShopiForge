import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ComparePanel } from '../components/ComparePanel';
import { ApiError, getProductCompare } from '../lib/api';
import type { CompareData, CompareResponse } from '../types';

type PageState = 'loading' | 'ready' | 'error' | 'not_found';


function pushStatusLabel(status: string): string {
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

function pushStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pushed':
      return 'bg-emerald-50 text-emerald-800';
    case 'failed':
      return 'bg-red-50 text-red-800';
    case 'pending':
      return 'bg-amber-50 text-amber-800';
    case 'skipped':
    default:
      return 'bg-slate-100 text-slate-700';
  }
}


export function ComparePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? undefined;

  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState<CompareResponse | null>(null);

  useEffect(() => {
    if (!id) {
      setState('not_found');
      return;
    }

    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);

      try {
        const data = await getProductCompare(id!, jobId);
        if (cancelled) return;
        setCompare(data);
        setState('ready');
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 404) {
          setState('not_found');
          setError(err.message);
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load compare data');
        setState('error');
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, jobId]);

  if (state === 'loading') {
    return (
      <div>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
        <p className="mt-6 text-slate-600">Loading compare data...</p>
      </div>
    );
  }


  if (state === 'not_found' || !compare) {
    return (
      <div>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-slate-900">
            No optimization result found
          </h1>
          <p className="mt-2 text-slate-600">
            {error ??
              'Optimize this product from the dashboard to generate a before/after comparison.'}
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Back to dashboard →
          </Link>
        </div>
      </div>
    );
  }


  if (state === 'error') {
    return (
      <div>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
        <p className="mt-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      </div>
    );
  }


  const compareData: CompareData = {
    productId: compare.productId,
    before: compare.before,
    after: compare.after,
  };
  
  const showFallbackWarning = compare.usedFallback || compare.validationErrors != null;

  const pushStatus = compare.shopifyPushStatus ?? 'skipped';


  return (
    <div>
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        Back to dashboard
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Compare</h1>
          <p className="mt-1 text-slate-600">
            Review the original listing beside the AI-optimized version.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            AI optimization result
          </span>
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${pushStatusBadgeClass(pushStatus)}`}
          >
            {pushStatusLabel(pushStatus)}
          </span>
        </div>
      </div>
      {showFallbackWarning && (
        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"
          role="status"
        >
          <p className="text-amber-900">
            AI output required fallback formatting. Review carefully before any
            future Shopify push.
          </p>
        </div>
      )}

      {compare.staleWarning === true && (
        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"
          role="status"
        >
          <p className="text-amber-900">
            This product changed in Shopify after optimization started. Review
            carefully — write-back may overwrite newer merchant edits.
          </p>
        </div>
      )}


      {pushStatus === 'failed' && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <p className="text-red-900">
            {compare.shopifyPushError ??
              'Shopify was not updated. The AI result is still available below for review.'}
          </p>
        </div>
      )}

      <div className="mt-6">
        <ComparePanel compareData={compareData} />
      </div>
    </div>
  );
}