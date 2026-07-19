export interface ProductSyncJobPayload {
    shopId: string;
    updatedAtMin?: string | null;
    requestedAt: string;
}