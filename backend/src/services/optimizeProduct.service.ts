import type { ToneVariant } from '@shopiforge/shared';
import { AppError } from '../middleware/errorHandler.js';
import {
  createSingleOptimizeJob,
  markJobCompleted,
  markJobFailed,
  markJobProcessing,
} from '../repositories/jobRepository.js';
import {
  completeJobResult,
  createJobResult,
  failJobResult,
  markJobResultProcessing,
} from '../repositories/jobResultRepository.js';
import { findProductByIdForShop } from '../repositories/productRepository.js';
import { buildInputSnapshot } from '../utils/inputSnapshot.js';
import { optimizeProductListing } from './aiOrchestrator.service.js';

const ALLOWED_TONES: ToneVariant[] = ['default', 'premium', 'casual', 'luxury'];


export interface OptimizeProductRequest {
    shopId: string;
    productId: string;
    tone?: ToneVariant;
}

export interface OptimizeProductResponse {
    jobId: string;
    jobResultId: string;
    status: 'completed';
    usedFallback: boolean;
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

    await markJobProcessing(job.id);
    await markJobResultProcessing(jobResult.id);

    try {
        const result = await optimizeProductListing({
            title: product.title,
            descriptionHtml: product.descriptionHtml ?? '',
            tags: product.tags ?? [],
            vendor: product.vendor,
            productType: product.productType,
            variantsSummary: product.variantsSummary.map((variant) => ({
                title: variant.title,
                price: variant.price,
                sku: variant.sku,
            })),
            tone,
        });

        await completeJobResult({
            jobResultId: jobResult.id,
            rawAiOutput: result.rawAiOutput,
            output: result.output,
            validationErrors: result.validationErrors,
            repairAttempts: result.repairAttempts,
            processingMs: result.processingMs,
        });

        await markJobCompleted(job.id);


        return {
            jobId: job.id,
            jobResultId: jobResult.id,
            status: 'completed',
            usedFallback: result.usedFallback,
            compareUrl: `/products/${product.id}/compare?jobId=${job.id}`,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Product optimization failed';

        await failJobResult(jobResult.id, message);
        await markJobFailed(job.id, message);
        
        throw err instanceof AppError
            ? err
            : new AppError(500, 'OPTIMIZE_FAILED', message);
    }

}
