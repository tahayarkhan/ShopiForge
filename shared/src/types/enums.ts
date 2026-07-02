export type JobType = 'single' | 'batch' | 'sync';

export type JobStatus = 
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'partial';

export type JobResultStatus = 
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';

export type ToneVariant = 'default' | 'premium' | 'casual' | 'luxury';

export type ShopifyPushStatus = 'pending' | 'pushed' | 'failed' | 'skipped';
