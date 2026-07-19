export const OPTIMIZE_PRODUCT_QUEUE = 'optimize-product' as const;

export const MAX_BATCH_PRODUCTS = 50 as const;

export const OPTIMIZE_PRODUCT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const PRODUCT_SYNC_QUEUE = 'product-sync' as const;
export const PRODUCT_SYNC_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: 50,
  removeOnFail: 100,
};