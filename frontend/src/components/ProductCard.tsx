import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ApiError, optimizeProduct } from '../lib/api';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const imageUrl = product.images[0]?.url;
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOptimize() {
    setOptimizing(true);
    setError(null);

    try {
      const result = await optimizeProduct(product.id, 'default');
      // Phase 4: go poll the job — don't jump straight to compare
      navigate(`/jobs/${result.jobId}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Optimization failed',
      );
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* ... image + product details unchanged ... */}

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleOptimize}
          disabled={optimizing}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {optimizing ? 'Queuing...' : 'Optimize'}
        </button>
        <Link
          to={`/products/${product.id}/compare`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View compare
        </Link>
      </div>
    </article>
  );
}