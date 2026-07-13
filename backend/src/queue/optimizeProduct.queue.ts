import { Queue } from 'bullmq';
import {
  OPTIMIZE_PRODUCT_JOB_OPTIONS,
  OPTIMIZE_PRODUCT_QUEUE,
  type OptimizeProductJobPayload,
} from '@shopiforge/shared';
import { env } from '../config/env.js';

export const optimizeProductQueue = new Queue<OptimizeProductJobPayload>(
  OPTIMIZE_PRODUCT_QUEUE,
  {
    connection: {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
    },
  },
);

export async function enqueueOptimizeProductJob(
  payload: OptimizeProductJobPayload,
): Promise<void> {
  await optimizeProductQueue.add('optimize-product', payload, {
    ...OPTIMIZE_PRODUCT_JOB_OPTIONS,
    jobId: payload.jobId,
  });
}