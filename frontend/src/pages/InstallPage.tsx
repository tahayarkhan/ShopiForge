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
      <div className="animate-fade-in mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        {/* Brand at hero scale — not just a page title */}
        <p
          className="text-4xl font-bold tracking-tight text-(--color-ink) sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ShopiForge
        </p>
        {/* One headline */}
        <h1 className="mt-6 text-xl font-semibold text-(--color-ink) sm:text-2xl">
          Connect your Shopify store
        </h1>
        {/* One supporting line */}
        <p className="mt-2 text-(--color-muted)">
          Enter your store domain to install and sync products.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="shop"
              className="block text-sm font-medium text-(--color-ink)"
            >
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
              className="mt-1 w-full rounded-md border border-(--color-ink)/20 bg-(--color-paper) px-3 py-2.5 text-(--color-ink) shadow-sm outline-none focus:border-(--color-forge) focus:ring-1 focus:ring-(--color-forge)"
            />
          </div>
          {error && (
            <p className="text-sm text-(--color-danger)" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-(--color-forge) px-4 py-2.5 text-sm font-medium text-(--color-paper) transition-colors hover:bg-(--color-forge-hover) disabled:opacity-50"
          >
            {submitting ? 'Redirecting...' : 'Connect store'}
          </button>
        </form>
        <p className="mt-8 text-sm text-(--color-muted)">
          Already connected?{' '}
          <Link
            to="/dashboard"
            className="font-medium text-(--color-mint) hover:underline"
          >
            Go to dashboard
          </Link>
        </p>
      </div>
    );

}