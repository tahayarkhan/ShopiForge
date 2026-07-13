export const OPTIMIZE_PRODUCT_QUEUE = 'optimize-product' as const;

export const OPTIMIZE_PRODUCT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
};