// Phase 1: duplicate minimal view types here.
// Avoid importing @shopiforge/shared in the browser — its barrel exports parseEnv (Node-only).

export interface ProductInputSnapshot {
    title: string;
    descriptionHtml: string;
    tags: string[];
}
  
  export interface MockProduct {
    id: string;
    title: string;
    descriptionHtml: string;
    tags: string[];
    vendor: string;
    productType: string;
    status: 'ACTIVE' | 'DRAFT';
    imageUrl?: string;
}

export interface CompareData {
  productId: string;
  before: ProductInputSnapshot;
  after: ProductInputSnapshot & {
    bulletPoints: string[];
    seoKeywords: string[];
  };
}

export interface ShopSafe {
  id: string;
  shopifyDomain: string;
  plan: string;
  isActive: boolean;
}

export interface ProductImage {
  url: string;
  altText?: string;
  shopifyMediaId?: string;
}

export interface VariantSummary {
  id: string;
  title: string;
  price: string;
  sku?: string;
}

export interface Product {
  id: string;
  shopId: string;
  shopifyProductId: string;
  shopifyGid: string;
  title: string;
  descriptionHtml: string | null;
  tags: string[] | null;
  vendor: string | null;
  productType: string | null;
  status: string | null;
  handle: string | null;
  images: ProductImage[];
  variantsSummary: VariantSummary[];
  shopifyUpdatedAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSyncSummary {
  synced: number;
  shopifyDomain: string;
  lastSyncedAt: string;
}

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
  };
}

export interface OptimizeProductResponse {
  jobId: string;
  jobResultId: string;
  status: 'completed' | 'failed';
  usedFallback: boolean;
  compareUrl: string;
}

export interface CompareResponse {
  productId: string;
  jobId: string;
  tone: string;
  before: ProductInputSnapshot;
  after: ProductInputSnapshot & {
    bulletPoints: string[];
    seoKeywords: string[];
  };
  usedFallback: boolean;
  validationErrors: Record<string, unknown> | null;
  shopifyPushStatus: string;
  createdAt: string;
}