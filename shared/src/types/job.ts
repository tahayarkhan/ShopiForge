import type { JobStatus, JobType, ToneVariant } from "./enums.js";

export interface Job {
    id: string;
    shopId: string;
    type: JobType;
    status: JobStatus;
    parentJobId: string | null;
    tone: ToneVariant;
    pushToShopify: boolean;
    totalCount: number;
    completedCount: number;
    failedCount: number;
    errorMessage: string | null;
    bullQueueName: string | null;
    bullJobId: string | null;
    idempotencyKey: string | null;
    metadata: Record<string, unknown>;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}