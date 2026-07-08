import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ApiError, getCurrentShop, getProducts, syncProducts } from '../lib/api';
import type { Product, ShopSafe } from '../types';


type DashboardState = 'loading' | 'unauthenticated' | 'ready';


export function DashboardPage() {
    const [state, setState] = useState<DashboardState>('loading');
    const [searchParams, setSearchParams] = useSearchParams();
    const [showInstalledBanner, setShowInstalledBanner] = useState(false);
    const [shop, setShop] = useState<ShopSafe | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const loadDashboard = useCallback(async () => {
      setError(null);
      setState('loading');


      const currentShop = await getCurrentShop();
      if (!currentShop) {
        setShop(null);
        setProducts([]);
        setState('unauthenticated');
        return;
      }

      setShop(currentShop);

      try {
        const list = await getProducts();
        setProducts(list);
        setState('ready');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setState('unauthenticated');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setState('ready');
      }
    }, []);

    useEffect(() => {
      loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
      if (searchParams.get('installed') === '1') {
        setShowInstalledBanner(true);
        setSearchParams({}, { replace: true });
      }
    }, [searchParams, setSearchParams]);

    async function handleSync() {
      setSyncing(true);
      setError(null);

      try {
        await syncProducts();
        const list = await getProducts();
        setProducts(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      } finally {
        setSyncing(false);
      }

    }


    if (state === 'loading') {
      return (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Dashboard</h1>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      );
    }


    if (state === 'unauthenticated') {
      return (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Dashboard</h1>
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-amber-900">Connect your Shopify store to get started.</p>
            <Link
              to="/install"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Install ShopiForge →
            </Link>
          </div>
        </div>
      );
    }
  



    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Product Dashboard</h1>
            {shop && (
              <p className="mt-1 text-sm text-slate-600">{shop.shopifyDomain}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync products'}
          </button>
        </div>

        {showInstalledBanner && (
        <div
          className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4"
          role="status"
        >
          <p className="text-green-900">
            Shopify store connected. Sync products to load the latest catalog.
          </p>
        </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {products.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No products synced yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Click &quot;Sync products&quot; to import from Shopify.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

    );
  }