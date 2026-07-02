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