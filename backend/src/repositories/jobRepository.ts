import { supabase } from '../lib/supabase.js';
import { mapJobRow, type JobRow } from '../mappers/jobMapper.js';
import type { Job, ToneVariant } from '@shopiforge/shared';

export interface CreateSingleOptimizeJobInput {
    shopId: string;
    tone: ToneVariant;
    pushToShopify: boolean;
}

export interface CreateBatchParentJobInput {
    shopId: string;
    tone: ToneVariant;
    totalCount: number;
    idempotencyKey: string;
    pushToShopify: boolean;
}
  
export interface CreateChildOptimizeJobInput {
    shopId: string;
    tone: ToneVariant;
    parentJobId: string;
    pushToShopify: boolean;
}

export async function createSingleOptimizeJob(
    input: CreateSingleOptimizeJobInput
): Promise<Job> {
    
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('jobs')
        .insert({
            shop_id: input.shopId,
            type: 'single',
            status: 'pending',
            tone: input.tone,
            push_to_shopify: input.pushToShopify,
            total_count: 1,
            completed_count: 0,
            failed_count: 0,
            bull_queue_name: null,
            bull_job_id: null,
            metadata: {},
            created_at: now,
            updated_at: now,
        })
        .select('*')
        .single();

    if (error) {
        throw new Error(`createSingleOptimizeJob failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);

}

export async function markJobProcessing(jobId: string): Promise<Job> {
    
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('jobs')
        .update({
            status: 'processing',
            started_at: now,
            updated_at: now,
        })
        .eq('id', jobId)
        .select('*')
        .single()
    
    if (error) {
        throw new Error(`markJobProcessing failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);

}


export async function markJobCompleted(jobId: string): Promise<Job> {
    const now = new Date().toISOString();

    const { data, error } = await supabase 
        .from('jobs')
        .update({
            status: 'completed',
            completed_count: 1,
            failed_count: 0,
            completed_at: now,
            updated_at: now,
        })
        .eq('id', jobId)
        .select('*')
        .single();
    
    if (error) {
        throw new Error(`markJobCompleted failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);
}


export async function markJobFailed(
    jobId: string,
    errorMessage: string,
): Promise<Job> {

    const now = new Date().toISOString();

    const { data, error } = await supabase 
        .from('jobs')
        .update({
            status: 'failed',
            failed_count: 1,
            error_message: errorMessage,
            completed_at: now,
            updated_at: now,
        })
        .eq('id', jobId)
        .select('*')
        .single();

    if (error) {
        throw new Error(`markJobFailed failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);

}

export async function findJobById(jobId: string): Promise<Job | null> {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();
    
    if (error) {
        throw new Error(`findJobById failed: ${error.message}`);
    }

    return data ? mapJobRow(data as JobRow) : null;
} 

export async function setJobBullMeta(
    jobId: string,
    queueName: string,
    bullJobId: string,
): Promise<Job> {

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('jobs')
        .update({
        bull_queue_name: queueName,
        bull_job_id: bullJobId,
        updated_at: now,
        })
        .eq('id', jobId)
        .select('*')
        .single();
    
    if (error) {
        throw new Error(`setJobBullMeta failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);

}

export async function createBatchParentJob(
    input: CreateBatchParentJobInput,
): Promise<Job> {
    
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('jobs')
        .insert({
            shop_id: input.shopId,
            type: 'batch',
            status: 'pending',
            parent_job_id: null,
            tone: input.tone,
            push_to_shopify: input.pushToShopify,
            total_count: input.totalCount,
            completed_count: 0,
            failed_count: 0,
            bull_queue_name: null,
            bull_job_id: null,
            idempotency_key: input.idempotencyKey,
            metadata: {},
            created_at: now,
            updated_at: now,
        })
        .select('*')
        .single();

    if (error) {
        throw new Error(`createBatchParentJob failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);

}

export async function createChildOptimizeJob(
    input: CreateChildOptimizeJobInput
): Promise<Job> {

    const now = new Date().toISOString();


    const { data, error } = await supabase
        .from('jobs')
        .insert({
            shop_id: input.shopId,
            type: 'single',
            status: 'pending',
            parent_job_id: input.parentJobId,
            tone: input.tone,
            push_to_shopify: input.pushToShopify,
            total_count: 1,
            completed_count: 0,
            failed_count: 0,
            bull_queue_name: null,
            bull_job_id: null,
            idempotency_key: null,
            metadata: {},
            created_at: now,
            updated_at: now,
        })
        .select('*')
        .single();

    if (error) {
        throw new Error(`createChildOptimizeJob failed: ${error.message}`);
    }

    return mapJobRow(data as JobRow);
 
}


export async function findJobByIdempotencyKey(
    key: string
): Promise<Job | null> {

    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('idempotency_key', key)
        .maybeSingle();

    if (error) {
        throw new Error(`findJobByIdempotencyKey failed: ${error.message}`);
    }

    return data ? mapJobRow(data as JobRow) : null;

}

export async function listChildJobsByParentId(
    parentJobId: string,
  ): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('parent_job_id', parentJobId)
      .order('created_at', { ascending: true });
  
    if (error) {
      throw new Error(`listChildJobsByParentId failed: ${error.message}`);
    }
  
    return (data as JobRow[]).map(mapJobRow);
}