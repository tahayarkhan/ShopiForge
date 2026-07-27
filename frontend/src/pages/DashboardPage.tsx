import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { BatchActionBar } from '../components/BatchActionBar';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/toastContext';
import {
  ApiError,
  getCurrentShop,
  getProducts,
  optimizeBatch,
  syncProducts,
} from '../lib/api';
import type { Product, ShopSafe } from '../types';

type DashboardState = 'loading' | 'unauthenticated' | 'ready';

type Tone = 'default' | 'premium' | 'casual' | 'luxury';


const MAX_BATCH_PRODUCTS = 50;

export function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>('loading');
  const [searchParams, setSearchParams] = useSearchParams();
  const [showInstalledBanner, setShowInstalledBanner] = useState(false);
  const [shop, setShop] = useState<ShopSafe | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchOptimizing, setBatchOptimizing] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const TONES: Tone[] = ['default', 'premium', 'casual', 'luxury'];
  const [tone, setTone] = useState<Tone>('default');

  const toast = useToast();



  function handleToggleSelect(productId: string) {
    setBatchError(null);

    setSelectedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length >= MAX_BATCH_PRODUCTS) {
        setBatchError(`You can select at most ${MAX_BATCH_PRODUCTS} products`);
        return prev;
      }

      return [...prev, productId];
    });
  }

  async function handleBatchOptimize() {
    if (selectedIds.length === 0) return;

    setBatchOptimizing(true);
    setBatchError(null);

    try {
      const result = await optimizeBatch(
        selectedIds,
        tone,
        crypto.randomUUID(),
      );
      setSelectedIds([]);
      navigate(`/jobs/${result.jobId}`);
    } catch (err) {
      setBatchError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Batch optimization failed',
      );
    } finally {
      setBatchOptimizing(false);
    }
  }

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
      const result = await syncProducts();
      toast.success(`Synced ${result.synced} products`);
      const list = await getProducts();
      setProducts(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sync failed';
      toast.error(message);
      setError(message); // optional if toast is enough
    } finally {
      setSyncing(false);
    }
  }

  if (state === 'loading') {
    return (
      <div>
        <h1
          className="text-2xl font-semibold text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Product Dashboard
        </h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-lg border border-[var(--color-ink)]/10 p-4"
            >
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1
          className="text-3xl font-semibold text-(--color-ink)"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Connect your store
        </h1>
        <p className="mt-3 text-(--color-muted)">
          Install ShopiForge on Shopify to sync products and run optimizations.
        </p>
        <Link
          to="/install"
          className="mt-8 inline-flex rounded-md bg-(--color-forge) px-5 py-2.5 text-sm font-medium text-(--color-paper) hover:bg-(--color-forge-hover)"
        >
          Install ShopiForge
        </Link>
      </div>
    );
  }


  const activeCount = products.filter(
    (p) => p.status?.toUpperCase() === 'ACTIVE',
  ).length;

  const draftCount = products.filter(
    (p) => p.status?.toUpperCase() === 'DRAFT',
  ).length;

  const latestSyncedAt = products.reduce<string | null>((latest, p) => {
    if (!p.lastSyncedAt) return latest;
    if (!latest) return p.lastSyncedAt;
    return p.lastSyncedAt > latest ? p.lastSyncedAt : latest;
  }, null);

  function formatSyncLabel(iso: string | null) {
    if (!iso) return 'Never synced';
    return new Date(iso).toLocaleString();
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

        {/* Stats strip */}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <div className="rounded-lg border border-[var(--color-ink)]/10 px-4 py-3">
            <p className="text-[var(--color-muted)]">Products</p>
            <p className="mt-0.5 text-lg font-semibold text-[var(--color-ink)]">
              {products.length}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-ink)]/10 px-4 py-3">
            <p className="text-[var(--color-muted)]">Active / Draft</p>
            <p className="mt-0.5 text-lg font-semibold text-[var(--color-ink)]">
              {activeCount} / {draftCount}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-ink)]/10 px-4 py-3">
            <p className="text-[var(--color-muted)]">Last sync</p>
            <p className="mt-0.5 text-lg font-semibold text-[var(--color-ink)]">
              {formatSyncLabel(latestSyncedAt)}
            </p>
          </div>

          {shop && (
            <div className="rounded-lg border border-[var(--color-ink)]/10 px-4 py-3">
              <p className="text-[var(--color-muted)]">Shop</p>
              <p className="mt-0.5 flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                <span className="capitalize">{shop.plan}</span>
                <span
                  className={[
                    'inline-block h-2 w-2 rounded-full',
                    shop.isActive
                      ? 'bg-(--color-mint)'
                      : 'bg-(--color-danger)',
                  ].join(' ')}
                  title={shop.isActive ? 'Active' : 'Inactive'}
                />
              </p>
            </div>
          )}
        </div>


        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-md bg-(--color-forge) px-4 py-2 text-sm font-medium text-(--color-paper) hover:bg-(--color-forge-hover) disabled:opacity-50"
          >
          {syncing ? 'Syncing...' : 'Sync products'}
        </button>


        <div
          className="inline-flex rounded-lg border border-[var(--color-ink)]/15 p-0.5"
          role="group"
          aria-label="Optimization tone"
        >
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={[
                'rounded-md px-3 py-1.5 text-sm capitalize transition',
                tone === t
                  ? 'bg-[var(--color-forge)] text-[var(--color-paper)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

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
        <div className="mt-10 rounded-lg border border-dashed border-(--color-ink)/20 px-6 py-16 text-center">
          <p
            className="text-xl font-semibold text-(--color-ink)"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No products yet
          </p>
          <p className="mt-2 text-sm text-(--color-muted)">
            Pull your catalog from Shopify to start optimizing listings.
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="mt-6 rounded-md bg-(--color-forge) px-5 py-2.5 text-sm font-medium text-(--color-paper) hover:bg-(--color-forge-hover) disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync products'}
          </button>
        </div>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <BatchActionBar
              selectedCount={selectedIds.length}
              maxCount={MAX_BATCH_PRODUCTS}
              tone={tone}
              optimizing={batchOptimizing}
              error={batchError}
              onClear={() => {
                setSelectedIds([]);
                setBatchError(null);
              }}
              onOptimize={handleBatchOptimize}
            />
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tone={tone}
                selected={selectedIds.includes(product.id)}
                onToggleSelect={handleToggleSelect}
                selectionDisabled={selectedIds.length >= MAX_BATCH_PRODUCTS}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}