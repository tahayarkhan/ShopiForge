import { AppError } from '../middleware/errorHandler.js';
import { mapJobResultOutputToCompareAfter } from '../mappers/jobResultMapper.js';
import { findJobById } from '../repositories/jobRepository.js';
import { findJobResultForCompare } from '../repositories/jobResultRepository.js';
import { findProductByIdForShop } from '../repositories/productRepository.js';

export interface ProductCompareResponse {
    productId: string;
    jobId: string;
    tone: string;
    before: {
        title: string;
        descriptionHtml: string;
        tags: string[];
    };
    after: {
        title: string;
        descriptionHtml: string;
        tags: string[];
        bulletPoints: string[];
        seoKeywords: string[];
    };
    usedFallback: boolean;
    validationErrors: Record<string, unknown> | null;
    shopifyPushStatus: string;
    createdAt: string;
}

export async function getProductCompare(params: {
    shopId: string, 
    productId: string;
    jobId?: string;
}): Promise<ProductCompareResponse> {

    const product = await findProductByIdForShop(params.productId, params.shopId);

    if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const jobResult = await findJobResultForCompare(
        params.productId,
        params.jobId,
    );

    if (!jobResult) {
        throw new AppError(
          404,
          'COMPARE_NOT_FOUND',
          'No optimization result found for this product',
        );
    }

    const after = mapJobResultOutputToCompareAfter(jobResult.output);

    if (!after) {
        throw new AppError(
        500,
        'COMPARE_OUTPUT_INVALID',
        'Stored optimization output is invalid',
        );
    }

    const job = await findJobById(jobResult.jobId);

    return {
        productId: product.id,
        jobId: jobResult.jobId,
        tone: job?.tone ?? 'default',
        before: {
            title: jobResult.inputSnapshot.title,
            descriptionHtml: jobResult.inputSnapshot.descriptionHtml,
            tags: jobResult.inputSnapshot.tags,
        },
        after, 
        usedFallback: jobResult.validationErrors != null,
        validationErrors: jobResult.validationErrors,
        shopifyPushStatus: jobResult.shopifyPushStatus,
        createdAt: jobResult.createdAt,
    };

}