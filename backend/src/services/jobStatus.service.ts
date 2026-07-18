import type { Job, JobResult, JobStatus } from '@shopiforge/shared';
import { AppError } from '../middleware/errorHandler.js';
import {
  findJobById,
  listChildJobsByParentId,
} from '../repositories/jobRepository.js';
import {
  listJobResultsByJobId,
  listJobResultsByJobIds,
} from '../repositories/jobResultRepository.js';
import { findProductByIdForShop } from '../repositories/productRepository.js';

export interface JobResultSummary {
    jobResultId: string;
    productId: string;
    productTitle: string;
    status: string;
    errorMessage: string | null;
    usedFallback: boolean | null;
    compareUrl: string | null;
    shopifyPushStatus: 'pending' | 'pushed' | 'failed' | 'skipped';
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

function progressPercentForSingle(status: JobStatus): number {
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

function progressPercentForBatch(job: Job): number {
    if (
        job.status === 'completed' ||
        job.status === 'failed' ||
        job.status === 'partial'
    ) {
        return 100;
    }

    if (job.totalCount <= 0) return 0;

    const done = job.completedCount + job.failedCount;

    return Math.min(100, Math.round((done / job.totalCount) * 100));

}


function progressPercentForJob(job: Job): number {
    if (job.type === 'batch') {
      return progressPercentForBatch(job);
    }
    return progressPercentForSingle(job.status);
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

async function buildResultSummaries(input: {
    shopId: string;
    jobResults: JobResult[];
}): Promise<JobResultSummary[]> {

    const results: JobResultSummary[] = [];

    for (const result of input.jobResults) {
        const product = await findProductByIdForShop(
            result.productId,
            input.shopId,
        );

        const productTitle = product?.title ?? result.inputSnapshot?.title ?? 'Unknown product';

        const owningJobId = result.jobId;

        results.push({
            jobResultId: result.id,
            productId: result.productId,
            productTitle,
            status: result.status,
            errorMessage: result.errorMessage,
            usedFallback: usedFallbackFromResult(result),
            compareUrl:
              result.status === 'completed'
                ? `/products/${result.productId}/compare?jobId=${owningJobId}`
                : null,
            shopifyPushStatus: result.shopifyPushStatus,

        });
    }

    return results;
}


export async function getJobStatusForShop(input: {
    shopId: string;
    jobId: string;
}): Promise<JobStatusResponse> {

    const job = await findJobById(input.jobId);

    if (!job || job.shopId !== input.shopId) {
        throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    let jobResults: JobResult[];

    if (job.type === 'batch') {
        const children = await listChildJobsByParentId(job.id)
        jobResults = await listJobResultsByJobIds(children.map((c) => c.id));
    } else {
        jobResults = await listJobResultsByJobId(job.id);
    }


    const results = await buildResultSummaries({
        shopId: input.shopId, 
        jobResults,
    });

    

    return {
        id: job.id,
        type: job.type,
        status: job.status,
        tone: job.tone,
        totalCount: job.totalCount,
        completedCount: job.completedCount,
        failedCount: job.failedCount,
        progressPercent: progressPercentForJob(job),
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        results,
    };


}