import type { ProductSyncJobPayload } from '@shopiforge/shared';
import { enqueueProductSync } from '../queue/productSync.queue.js';

export async function requestProductSync(shopId: string): Promise<{
    accepted: true;
    jobId: string;
    message: string;
}> {

    const payload: ProductSyncJobPayload = {
        shopId,
        requestedAt: new Date().toISOString(),
    };

    const jobId = await enqueueProductSync(payload);

    return {
        accepted: true,
        jobId,
        message: 'Product sync queued',
    };

}