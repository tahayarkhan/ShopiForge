import type {
    JobResult,
    ProductInputSnapshot,
    ProductOptimizationOutput,
} from '@shopiforge/shared';
import { ProductOptimizationOutputSchema } from '@shopiforge/shared'; 

export interface JobResultRow {
    id: string;
    job_id: string;
    product_id: string;
    status: JobResult['status'];
    input_snapshot: ProductInputSnapshot;
    raw_ai_output: string | null;
    output: Record<string, unknown> | null;
    validation_errors: Record<string, unknown> | null;
    shopify_push_status: JobResult['shopifyPushStatus'];
    shopify_push_error: string | null;
    error_message: string | null;
    retry_count: number;
    processing_ms: number | null;
    created_at: string;
    updated_at: string;
}

export function mapJobResultRow(row: JobResultRow): JobResult {
    return {
        id: row.id,
        jobId: row.job_id,
        productId: row.product_id,
        status: row.status,
        inputSnapshot: row.input_snapshot,
        rawAiOutput: row.raw_ai_output,
        output: row.output,
        validationErrors: row.validation_errors,
        shopifyPushStatus: row.shopify_push_status,
        shopifyPushError: row.shopify_push_error,
        errorMessage: row.error_message,
        retryCount: row.retry_count,
        processingMs: row.processing_ms,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export interface CompareAfterOutput{
    title: string;
    descriptionHtml: string;
    tags: string[];
    bulletPoints: string[];
    seoKeywords: string[];
}

export function mapJobResultOutputToCompareAfter(
    output: Record<string, unknown> | null,
): CompareAfterOutput | null {

    if (!output) return null;

    const parsed = ProductOptimizationOutputSchema.safeParse(output);

    if (!parsed.success) return null;

    return {
        title: parsed.data.title,
        descriptionHtml: parsed.data.descriptionHtml,
        tags: parsed.data.tags,
        bulletPoints: parsed.data.bulletPoints,
        seoKeywords: parsed.data.seoKeywords,
    };

}