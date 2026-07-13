import {
    OPTIMIZE_PRODUCT_QUEUE,
    type ToneVariant,
  } from '@shopiforge/shared';
  import { AppError } from '../middleware/errorHandler.js';
  import { enqueueOptimizeProductJob } from '../queue/optimizeProduct.queue.js';
  import {
    createSingleOptimizeJob,
    setJobBullMeta,
  } from '../repositories/jobRepository.js';
  import {
    createJobResult,
    findActiveJobResultForProduct, // optional — see 4.3
  } from '../repositories/jobResultRepository.js';
  import { findProductByIdForShop } from '../repositories/productRepository.js';
  import { buildInputSnapshot } from '../utils/inputSnapshot.js';
  

const ALLOWED_TONES: ToneVariant[] = ['default', 'premium', 'casual', 'luxury'];


export interface OptimizeProductRequest {
    shopId: string;
    productId: string;
    tone?: ToneVariant;
}

export interface OptimizeProductResponse {
    jobId: string;
    jobResultId: string;
    status: 'pending';
    pollUrl: string;
    compareUrl: string;
}

function parseTone(tone: unknown): ToneVariant {
    const resolved = tone ?? 'default';

    if (
        typeof resolved !== 'string' ||
        !ALLOWED_TONES.includes(resolved as ToneVariant)
    ) {
        throw new AppError(400, 'INVALID_TONE', 'Invalid tone');
    }

    return resolved as ToneVariant;
}

export async function optimizeProductForShop(input: OptimizeProductRequest): Promise<OptimizeProductResponse> {
    const tone = parseTone(input.tone);

    const product = await findProductByIdForShop(input.productId, input.shopId);

    if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }


    const active = await findActiveJobResultForProduct(product.id);

    if (active) {
        throw new AppError(
          409,
          'JOB_IN_PROGRESS',
          'An optimization job is already pending or processing for this product',
        );
    }


    const inputSnapshot = buildInputSnapshot(product);

    const job = await createSingleOptimizeJob({
        shopId: input.shopId,
        tone,
    });

    const jobResult = await createJobResult({
        jobId: job.id,
        productId: product.id,
        inputSnapshot,
    });

    await enqueueOptimizeProductJob({
        jobId: job.id,
        jobResultId: jobResult.id,
        shopId: input.shopId,
        productId: product.id,
        tone,
    });

    await setJobBullMeta(job.id, OPTIMIZE_PRODUCT_QUEUE, job.id);


    return {
        jobId: job.id,
        jobResultId: jobResult.id,
        status: 'pending',
        pollUrl: `/jobs/${job.id}`,
        compareUrl: `/products/${product.id}/compare?jobId=${job.id}`,
    };

}
