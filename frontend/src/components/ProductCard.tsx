import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ApiError, optimizeProduct } from '../lib/api';
import { StatusChip } from './StatusChip';
import type { Product, VariantSummary } from '../types';



function formatPriceRange(variants: VariantSummary[]): string | null {
  if (!variants.length) return null;
  const prices = variants
    .map((v) => Number.parseFloat(v.price))
    .filter((n) => !Number.isNaN(n));
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  return min === max ? fmt(min) : `${fmt(min)} - ${fmt(max)}`;
}

type Tone = 'default' | 'premium' | 'casual' | 'luxury';



interface ProductCardProps {
  product: Product;
  tone: Tone;
  selected?: boolean;
  onToggleSelect?: (productId: string) => void;
  selectionDisabled?: boolean;
}


export function ProductCard({ 
  product,
  tone,
  selected = false,
  onToggleSelect,
  selectionDisabled = false,
}: ProductCardProps) {

  const navigate = useNavigate();
  const imageUrl = product.images[0]?.url;
  const priceLabel = formatPriceRange(product.variantsSummary);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOptimize() {
    setOptimizing(true);
    setError(null);

    try {
      const result = await optimizeProduct(product.id, tone);
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
      <article
      className={[
        'overflow-hidden rounded-lg border bg-[var(--color-paper)] transition',
        'hover:-translate-y-0.5 hover:border-[var(--color-forge)]/50',
        selected
          ? 'border-[var(--color-forge)] shadow-sm'
          : 'border-[var(--color-ink)]/10',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2 p-3 pb-0">
        {onToggleSelect && (
          <label className="flex cursor-pointer items-center pt-1">
            <input
              type="checkbox"
              checked={selected}
              disabled={selectionDisabled && !selected}
              onChange={() => onToggleSelect(product.id)}
              className="h-4 w-4 rounded border-[var(--color-ink)]/30"
              aria-label={`Select ${product.title}`}
            />
          </label>
        )}
        {product.status && <StatusChip status={product.status} />}
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.images[0]?.altText ?? product.title}
          className="mt-2 h-40 w-full object-cover"
        />
      ) : (
        <div className="mt-2 flex h-40 items-center justify-center bg-[var(--color-ink)]/5 text-sm text-[var(--color-muted)]">
          No image
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold text-[var(--color-ink)]">{product.title}</h2>
        {priceLabel && (
          <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
            {priceLabel}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1">
          {product.vendor && (
            <span className="rounded-full bg-[var(--color-ink)]/5 px-2 py-0.5 text-xs text-[var(--color-muted)]">
              {product.vendor}
            </span>
          )}
          {product.productType && (
            <span className="rounded-full bg-[var(--color-ink)]/5 px-2 py-0.5 text-xs text-[var(--color-muted)]">
              {product.productType}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={optimizing}
            className="rounded-md bg-[var(--color-forge)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-forge-hover)] disabled:opacity-50"
          >
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </button>
          <Link
            to={`/products/${product.id}/compare`}
            className="text-sm font-medium text-[var(--color-mint)] hover:underline"
          >
            View compare
          </Link>
        </div>
      </div>
    </article>
  );
}