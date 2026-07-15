import type { Job, JobResult, JobStatus } from '@shopiforge/shared';
import { AppError } from '../middleware/errorHandler.js';
import { findJobById } from '../repositories/jobRepository.js';
import { listJobResultsByJobId } from '../repositories/jobResultRepository.js';
import { findProductByIdForShop } from '../repositories/productRepository.js';

export interface JobResultSummary {
    jobResultId: string;
    productId: string;
    productTitle: string;
    status: string;
    errorMessage: string | null;
    usedFallback: boolean | null;
    compareUrl: string | null;
}

export interface JobStatusResponse {
    id: string;
    type: Job['type'];
    status: JobStatus;
    tone: string;
    totalCount: number;
    completedCount: number;
    failedCount: number;
    progressPercent: number;
    errorMessage: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    results: JobResultSummary[];
}

function progressPercentForJob(status: JobStatus): number {
    switch (status) {
        case 'pending':
            return 0;
        case 'processing':
            return 50;
        case 'completed':
        case 'failed':
        case 'partial':
            return 100;
        default:
            return 0;
    }
}

function usedFallbackFromResult(result: JobResult): boolean | null {
    if (result.status !== 'completed') return null;

    const errors = result.validationErrors;

    if (
        errors &&
        typeof errors === 'object' &&
        'message' in errors &&
        typeof (errors as { message?: unknown }).message === 'string' &&
        (errors as { message: string }).message.includes('fallback')
    ) {
        return true;
    }

    return false;
    
}


export async function getJobStatusForShop(input: {
    shopId: string;
    jobId: string;
}): Promise<JobStatusResponse> {

    const job = await findJobById(input.jobId);

    if (!job || job.shopId !== input.shopId) {
        throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    const jobResults = await listJobResultsByJobId(job.id);

    const results: JobResultSummary[] = [];

    for (const result of jobResults) {
        const product = await findProductByIdForShop(result.productId, input.shopId);

        const productTitle = product?.title ?? result.inputSnapshot?.title ?? 'Unknown product';

        results.push({
            jobResultId: result.id,
            productId: result.productId,
            productTitle,
            status: result.status,
            errorMessage: result.errorMessage,
            usedFallback: usedFallbackFromResult(result),
            compareUrl:
              result.status === 'completed'
                ? `/products/${result.productId}/compare?jobId=${job.id}`
                : null,
        });

    }

    return {
        id: job.id,
        type: job.type,
        status: job.status,
        tone: job.tone,
        totalCount: job.totalCount,
        completedCount: job.completedCount,
        failedCount: job.failedCount,
        progressPercent: progressPercentForJob(job.status),
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        results,
    };


}