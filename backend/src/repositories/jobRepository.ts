import { supabase } from '../lib/supabase.js';
import { mapJobRow, type JobRow } from '../mappers/jobMapper.js';
import type { Job, ToneVariant } from '@shopiforge/shared';

export interface CreateSingleOptimizeJobInput {
    shopId: string;
    tone: ToneVariant;
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
            push_to_shopify: false,
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