import type { JobResultStatus, ShopifyPushStatus } from './enums.js';
import type { ProductInputSnapshot } from './product.js';

export interface JobResult {
    id: string;
    jobId: string;
    productId: string;
    status: JobResultStatus;
    inputSnapshot: ProductInputSnapshot;
    rawAiOutput: string | null;
    output: Record<string, unknown> | null;
    validationErrors: Record<string, unknown> | null;
    shopifyPushStatus: ShopifyPushStatus;
    shopifyPushError: string | null;
    errorMessage: string | null;
    retryCount: number;
    processingMs: number | null;
    createdAt: string;
    updatedAt: string;
}