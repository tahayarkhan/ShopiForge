import type { Job } from '@shopiforge/shared';

export interface JobRow {
    id: string;
    shop_id: string;
    type: Job['type'];
    status: Job['status'];
    parent_job_id: string | null;
    tone: Job['tone'];
    push_to_shopify: boolean;
    total_count: number;
    completed_count: number;
    failed_count: number;
    error_message: string | null;
    bull_queue_name: string | null;
    bull_job_id: string | null;
    idempotency_key: string | null;
    metadata: Record<string, unknown> | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export function mapJobRow(row: JobRow): Job {
    return {
        id: row.id,
        shopId: row.shop_id,
        type: row.type,
        status: row.status,
        parentJobId: row.parent_job_id,
        tone: row.tone,
        pushToShopify: row.push_to_shopify,
        totalCount: row.total_count,
        completedCount: row.completed_count,
        failedCount: row.failed_count,
        errorMessage: row.error_message,
        bullQueueName: row.bull_queue_name,
        bullJobId: row.bull_job_id,
        idempotencyKey: row.idempotency_key,
        metadata: row.metadata ?? {},
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}