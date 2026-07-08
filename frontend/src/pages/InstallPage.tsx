import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { normalizeShopInput } from '../lib/shopDomain';

const API_URL = import.meta.env.VITE_API_URL;


export function InstallPage() {
    const [shop, setShop] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!API_URL) {
            setError('VITE_API_URL is not configured');
            return;
        }

        try {
            setSubmitting(true);
            const normalized = normalizeShopInput(shop);
            const authUrl = `${API_URL}/shopify/auth?shop=${encodeURIComponent(normalized)}`;
            window.location.assign(authUrl);
        } catch (err) {
            setSubmitting(false);
            setError(err instanceof Error ? err.message : 'Invalid shop domain');
        }

    }

    return (
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Connect Shopify Store</h1>
          <p className="mt-2 text-slate-600">
            Enter your store domain to install ShopiForge and sync products.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="shop" className="block text-sm font-medium text-slate-700">
                Shop domain
              </label>
              <input
                id="shop"
                name="shop"
                type="text"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="my-store or my-store.myshopify.com"
                autoComplete="off"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Redirecting...' : 'Connect store'}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-500">
            Already connected?{' '}
            <Link to="/dashboard" className="font-medium text-blue-600 hover:underline">
              Go to dashboard
            </Link>
          </p>
        </div>
    );

}