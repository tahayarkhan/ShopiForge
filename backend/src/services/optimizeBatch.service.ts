import { randomUUID } from 'node:crypto';
import {
  MAX_BATCH_PRODUCTS,
  OPTIMIZE_PRODUCT_QUEUE,
  type ToneVariant,
} from '@shopiforge/shared';
import { AppError } from '../middleware/errorHandler.js';
import { enqueueOptimizeProductJob } from '../queue/optimizeProduct.queue.js';
import {
  createBatchParentJob,
  createChildOptimizeJob,
  findJobByIdempotencyKey,
  setJobBullMeta,
} from '../repositories/jobRepository.js';
import {
  createJobResult,
  findActiveJobResultsForProducts,
} from '../repositories/jobResultRepository.js';
import { findProductByIdForShop } from '../repositories/productRepository.js';
import { buildInputSnapshot } from '../utils/inputSnapshot.js';
import { parsePushToShopify } from '../utils/parsePushToShopify.js';


const ALLOWED_TONES: ToneVariant[] = ['default', 'premium', 'casual', 'luxury'];

export interface OptimizeBatchRequest {
    shopId: string;
    productIds: unknown;
    tone?: unknown;
    idempotencyKey?: unknown;
    pushToShopify?: unknown; 
}
export interface OptimizeBatchResponse {
    jobId: string;
    status: 'pending';
    type: 'batch';
    totalCount: number;
    pollUrl: string;
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

function parseProductIds(productIds: unknown): string[] {

    if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new AppError(
            400,
            'INVALID_REQUEST',
            'productIds must be a non-empty array',
        );
    }

    const ids = productIds.map((id) => {
        if (typeof id !== 'string' || id.trim() === '') {
            throw new AppError(
                400,
                'INVALID_REQUEST',
                'Each productId must be a non-empty string',
            );
        }
        return id.trim();
    })

    const unique = [...new Set(ids)];

    if (unique.length > MAX_BATCH_PRODUCTS) {
        throw new AppError(
            400,
            'BATCH_TOO_LARGE',
            `Batch cannot exceed ${MAX_BATCH_PRODUCTS} products`,
        );
    }

    return unique;
}

function resolveIdempotencyKey(
    shopId: string,
    clientKey: unknown,
): string {
    
    if (typeof clientKey === 'string' && clientKey.trim() !== '') {
        return clientKey.trim();
    }

    return `${shopId}:batch:${randomUUID()}`;

}

function toBatchResponse(job: {
    id: string;
    totalCount: number;
}): OptimizeBatchResponse {
    return {
        jobId: job.id,
        status: 'pending',
        type: 'batch',
        totalCount: job.totalCount,
        pollUrl: `/jobs/${job.id}`,
    };
}

export async function optimizeBatchForShop(
    input: OptimizeBatchRequest,
): Promise<OptimizeBatchResponse> {

    const tone = parseTone(input.tone);
    const productIds = parseProductIds(input.productIds);
    const idempotencyKey = resolveIdempotencyKey(input.shopId, input.idempotencyKey);
    const pushToShopify = parsePushToShopify(input.pushToShopify);

    const existing = await findJobByIdempotencyKey(idempotencyKey);

    if (existing) {
        if (existing.shopId !== input.shopId) {
            throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key conflict');
        }

        return toBatchResponse(existing);
    }

    const products = [];

    for (const productId of productIds) {
        const product = await findProductByIdForShop(productId, input.shopId);
        if (!product) {
            throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
        }
        products.push(product);
    }

    const active = await findActiveJobResultsForProducts(products.map((p) => p.id));

    if (active.length > 0) {
        throw new AppError(
          409,
          'JOB_IN_PROGRESS',
          'An optimization job is already pending or processing for one or more selected products',
        );
    }

    let parent;

    try {
        parent = await createBatchParentJob({
            shopId: input.shopId,
            tone,
            totalCount: products.length,
            idempotencyKey,
            pushToShopify,
        });
    } catch (err) {
        const raced = await findJobByIdempotencyKey(idempotencyKey);
        if (raced && raced.shopId === input.shopId) {
            return toBatchResponse(raced);
        }
        throw err;
    }

    for (const product of products) {
        const child = await createChildOptimizeJob({
            shopId: input.shopId,
            tone,
            parentJobId: parent.id,
            pushToShopify,
        })

        const jobResult = await createJobResult({
            jobId: child.id,
            productId: product.id,
            inputSnapshot: buildInputSnapshot(product),
            shopifyPushStatus: pushToShopify ? 'pending' : 'skipped',
        });

        await enqueueOptimizeProductJob({
            jobId: child.id,
            jobResultId: jobResult.id,
            shopId: input.shopId,
            productId: product.id,
            tone,
            parentJobId: parent.id,
            pushToShopify: child.pushToShopify,
        });

        await setJobBullMeta(child.id, OPTIMIZE_PRODUCT_QUEUE, child.id);
    }



    return toBatchResponse(parent);

}
