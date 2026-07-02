import { Link } from 'react-router-dom';
import type { MockProduct } from '../types';

interface ProductCardProps {
  product: MockProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-900">{product.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{product.vendor}</p>
      <Link
        to={`/products/${product.id}/compare`}
        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        View compare
      </Link>
    </article>
  );
}