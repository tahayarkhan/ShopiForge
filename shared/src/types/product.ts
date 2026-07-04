export interface ProductImage {
    url: string;
    altText?: string;
    shopifyMediaId?: string;
}

export interface VariantSummary {
    id: string;
    title: string;
    price : string;
    sku?: string;
}

export interface ProductInputSnapshot {
    title: string;
    descriptionHtml: string;
    tags: string[];
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