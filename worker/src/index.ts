import './loadEnv.js';
import { Worker } from 'bullmq';
import {
  OPTIMIZE_PRODUCT_QUEUE,
  parseEnv,
  type OptimizeProductJobPayload,
} from '@shopiforge/shared';
import { processOptimizeProductJob } from './processors/optimizeProduct.processor.js';
import { failJobResult } from './repositories/jobResultRepository.js';
import {
  markJobFailed,
  recordChildFailedOnParent,
} from './repositories/jobRepository.js';

// Must load .env before parseEnv / Redis
const env = parseEnv();

const worker = new Worker<OptimizeProductJobPayload>(
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


worker.on('completed', (job) => {
  console.log(`[worker] completed ${job.id}`);
});

worker.on('failed', async (job, err) => {
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

console.log(
  `[worker] listening on ${OPTIMIZE_PRODUCT_QUEUE} (${env.NODE_ENV})`,
);