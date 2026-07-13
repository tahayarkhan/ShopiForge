import type { Job } from '@shopiforge/shared';
import { supabase } from '../lib/supabase.js';
import { mapJobRow, type JobRow } from '../mappers/jobMapper.js';

export async function claimJobForProcessing(
    jobId: string,
): Promise<Job | null> {

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('jobs')
        .update({
            status: 'processing',
            started_at: now,
            updated_at: now,
        })
        .eq('id', jobId)
        .eq('status', 'pending') 
        .select('*')
        .maybeSingle();

    if (error) {
        throw new Error(`claimJobForProcessing failed: ${error.message}`);
    }

    return data ? mapJobRow(data as JobRow) : null;

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
