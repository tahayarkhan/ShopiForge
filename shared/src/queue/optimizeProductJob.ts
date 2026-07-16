import type { ToneVariant } from '../types/enums.js';

export interface OptimizeProductJobPayload {
    jobId: string;
    jobResultId: string;
    shopId: string;
    productId: string;
    tone: ToneVariant;
    parentJobId?: string | null;
}