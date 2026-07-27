import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ComparePanel } from '../components/ComparePanel';
import { ApiError, getProductCompare } from '../lib/api';
import type { CompareData, CompareResponse } from '../types';
import { Skeleton } from '../components/Skeleton';


type PageState = 'loading' | 'ready' | 'error' | 'not_found';

type StepState = 'done' | 'warn' | 'pending' | 'failed' | 'skipped';


function buildTimeline(compare: CompareResponse) {
  const validatedOk =
    !compare.usedFallback && compare.validationErrors == null;

  const push = compare.shopifyPushStatus ?? 'skipped';

  return [
    {
      key: 'optimized',
      label: 'Optimized',
      state: 'done' as StepState, // page loaded with a result
      detail: `Tone: ${compare.tone}`,
    },
    {
      key: 'validated',
      label: 'Validated',
      state: (validatedOk ? 'done' : 'warn') as StepState,
      detail: validatedOk
        ? 'Passed validation'
        : compare.usedFallback
          ? 'Fallback formatting used'
          : 'Validation warnings',
    },
    {
      key: 'pushed',
      label: 'Pushed',
      state: (
        push === 'pushed'
          ? 'done'
          : push === 'failed'
            ? 'failed'
            : push === 'pending'
              ? 'pending'
              : 'skipped'
      ) as StepState,
      detail: push,
    },
  ];
}

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
        <Link to="/dashboard" className="text-sm text-(--color-mint) hover:underline">
          Back to dashboard
        </Link>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[0, 1].map((col) => (
            <div
              key={col}
              className="space-y-3 rounded-lg border border-(--color-ink)/10 p-5"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
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
        <Link to="/dashboard" className="text-sm text-(--color-mint) hover:underline">
          Back to dashboard
        </Link>
        <div
          className="mt-6 rounded-lg border border-(--color-danger)/30 bg-(--color-danger)/10 p-4"
          role="alert"
        >
          <p className="text-(--color-danger)">{error}</p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm font-medium underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }


  const compareData: CompareData = {
    productId: compare.productId,
    before: compare.before,
    after: compare.after,
  };

  const steps = buildTimeline(compare);
  
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


<div className="mt-6 grid grid-cols-3">
  {steps.map((step, i) => (
    <div
      key={step.key}
      className="relative flex flex-col items-center text-center"
    >
      {/* Line from this dot's center → next dot's center */}
      {i < steps.length - 1 && (
        <div
          className={[
            'absolute top-4 left-1/2 z-0 h-0.5 w-full',
            steps[i + 1]!.state === 'done' || steps[i + 1]!.state === 'warn'
              ? 'bg-(--color-mint)/50'
              : steps[i + 1]!.state === 'failed'
                ? 'bg-(--color-danger)/40'
                : 'bg-(--color-ink)/15',
          ].join(' ')}
          aria-hidden="true"
        />
      )}

      <div
        className={[
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          step.state === 'done' && 'bg-(--color-mint) text-(--color-paper)',
          step.state === 'warn' && 'bg-amber-500 text-white',
          step.state === 'failed' && 'bg-(--color-danger) text-(--color-paper)',
          step.state === 'pending' && 'bg-(--color-forge)/20 text-(--color-forge)',
          step.state === 'skipped' && 'bg-(--color-ink)/10 text-(--color-muted)',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {i + 1}
      </div>

      <p className="mt-3 text-sm font-semibold text-(--color-ink)">
        {step.label}
      </p>
      <p className="text-xs capitalize text-(--color-muted)">
        {step.detail}
      </p>
    </div>
  ))}
</div>

      <div className="mt-6">
        <ComparePanel compareData={compareData} />
      </div>
    </div>
  );
}