import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images[0]?.url;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.images[0]?.altText ?? product.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-400">
          No image
        </div>
      )}

      <div className="p-4">
        <h2 className="font-semibold text-slate-900">{product.title}</h2>

        <dl className="mt-2 space-y-1 text-sm text-slate-600">
          {product.vendor && (
            <div>
              <dt className="inline font-medium">Vendor: </dt>
              <dd className="inline">{product.vendor}</dd>
            </div>
          )}
          {product.productType && (
            <div>
              <dt className="inline font-medium">Type: </dt>
              <dd className="inline">{product.productType}</dd>
            </div>
          )}
          {product.status && (
            <div>
              <dt className="inline font-medium">Status: </dt>
              <dd className="inline">{product.status}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium">Last synced: </dt>
            <dd className="inline">{formatSyncedAt(product.lastSyncedAt)}</dd>
          </div>
        </dl>

        {product.tags && product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link
          to={`/products/${product.id}/compare`}
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          View compare
        </Link>
      </div>
    </article>
  );
}