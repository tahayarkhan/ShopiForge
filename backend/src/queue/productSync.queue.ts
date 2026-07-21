import { Queue } from 'bullmq';
import {
  PRODUCT_SYNC_QUEUE,
  PRODUCT_SYNC_JOB_OPTIONS,
  type ProductSyncJobPayload,
} from '@shopiforge/shared';
import { createRedisConnection } from './connection.js';
import { env } from '../config/env.js';


export const productSyncQueue = new Queue<ProductSyncJobPayload> (
    PRODUCT_SYNC_QUEUE,
    {
        connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
        },
    },
)

export async function enqueueProductSync(
    payload: ProductSyncJobPayload,
): Promise<string> {

    const job = await productSyncQueue.add(
        'sync',
        payload,
        PRODUCT_SYNC_JOB_OPTIONS,
    );

    return job.id!;

}