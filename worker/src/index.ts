import './loadEnv.js';
import { Worker } from 'bullmq';
import {
  OPTIMIZE_PRODUCT_QUEUE,
  PRODUCT_SYNC_QUEUE,
  parseEnv,
  type OptimizeProductJobPayload,
  type ProductSyncJobPayload,
} from '@shopiforge/shared';
import { processOptimizeProductJob } from './processors/optimizeProduct.processor.js';
import { processProductSyncJob } from './processors/productSync.processor.js';
import { failJobResult } from './repositories/jobResultRepository.js';
import {
  markJobFailed,
  recordChildFailedOnParent,
} from './repositories/jobRepository.js';

// Must load .env before parseEnv / Redis
const env = parseEnv();

const optimizeWorker = new Worker<OptimizeProductJobPayload>(
  OPTIMIZE_PRODUCT_QUEUE,
  async (job) => {
    // job.data = the payload backend enqueued in Step 4
    await processOptimizeProductJob(job.data);
  },
  {
    connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
      },
    concurrency: 5,
  },
);

const productSyncWorker = new Worker<ProductSyncJobPayload>(
  PRODUCT_SYNC_QUEUE,
  async (job) => {
    await processProductSyncJob(job.data);
  },
  {
    connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
      },
    concurrency: 5,
  },
);





optimizeWorker.on('completed', (job) => {
  console.log(`[worker] completed ${job.id}`);
});

optimizeWorker.on('failed', async (job, err) => {
  console.error(`[worker] failed ${job?.id}:`, err.message);

  // After all BullMQ attempts are exhausted, mark DB as failed
  const attempts = job?.opts.attempts ?? 1;
  const attemptsMade = job?.attemptsMade ?? 0;

  if (job && attemptsMade >= attempts) {
    const { jobId, jobResultId, parentJobId } = job.data;
    try {
      await failJobResult(jobResultId, err.message);
      await markJobFailed(jobId, err.message);

      if (parentJobId) {
        await recordChildFailedOnParent(parentJobId);
      }


      console.error(`[worker] marked DB failed for ${jobId}`);
    } catch (dbErr) {
      console.error(`[worker] could not mark DB failed:`, dbErr);
    }
  }
});


productSyncWorker.on('completed', (job) => {
  console.log(`[product-sync] completed ${job.id}`);
});

productSyncWorker.on('failed', (job, err) => {
  console.error(`[product-sync] failed ${job?.id}:`, err.message);
});

console.log(
  `[worker] listening on ${OPTIMIZE_PRODUCT_QUEUE} + ${PRODUCT_SYNC_QUEUE} (${env.NODE_ENV})`,
);

