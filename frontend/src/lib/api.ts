import type {
    ApiErrorBody,
    CompareResponse,
    JobStatusResponse,
    OptimizeProductResponse,
    Product,
    ProductSyncSummary,
    ShopSafe,
} from '../types/index.js';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error('VITE_API_URL is not defined');
}

export class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 401) {
        const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
        throw new ApiError(
          401,
          body?.error?.code ?? 'SHOP_AUTH_REQUIRED',
          body?.error?.message ?? 'Shop authentication required'
        );
    }

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
        throw new ApiError(
          response.status,
          body?.error?.code ?? 'REQUEST_FAILED',
          body?.error?.message ?? `Request failed: ${response.status}`
        );
    }

    return response.json() as Promise<T>;

}

export async function getCurrentShop(): Promise<ShopSafe | null> {
    try {
        const data = await apiFetch<{ shop: ShopSafe }>('/shopify/current');
        return data.shop;
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
            return null;
        }
        throw err;
    }
}

export async function getProducts(): Promise<Product[]>{
    const data = await apiFetch<{ products: Product[] }>('/products');
    return data.products;
}

export async function syncProducts(): Promise<ProductSyncSummary> {
    return apiFetch<ProductSyncSummary>('/products/sync', {
      method: 'POST',
    });
}

export async function optimizeProduct(
    productId: string,
    tone: 'default' | 'premium' | 'casual' | 'luxury' = 'default',
): Promise<OptimizeProductResponse> {
    return apiFetch<OptimizeProductResponse>('/optimize/product', {
        method: 'POST',
        body: JSON.stringify({ productId, tone }),
    })
}

export async function getProductCompare(
    productId: string,
    jobId?: string,
): Promise<CompareResponse> {
    const query = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
    return apiFetch<CompareResponse>(`/products/${productId}/compare${query}`);
}

export async function getJob(jobId: string): Promise<JobStatusResponse> {
    return apiFetch<JobStatusResponse>(`/jobs/${encodeURIComponent(jobId)}`);
}


