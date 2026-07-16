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

export async function markParentProcessingIfPending(
    parentJobId: string,
): Promise<void> {

    const { error } = await supabase.rpc('mark_job_processing_if_pending', {
        p_job_id: parentJobId,
    });

    if (error) {
        throw new Error(
            `markParentProcessingIfPending failed: ${error.message}`,
        );
    }
}

export async function recordChildCompletedOnParent(
    parentJobId: string,
): Promise<Job> {

    const { data, error }  = await supabase.rpc(
        'increment_job_completed_count',
        { p_job_id: parentJobId },
    );

    if (error) {
        throw new Error(
          `recordChildCompletedOnParent failed: ${error.message}`,
        );
    }

    const row = Array.isArray(data) ? data[0] : data;


    if (!row) {
        throw new Error('recordChildCompletedOnParent returned no row');
    }


    return mapJobRow(row as JobRow);

}

export async function recordChildFailedOnParent(
    parentJobId: string,
): Promise<Job> {

    const { data, error } = await supabase.rpc(
        'increment_job_failed_count',
        { p_job_id: parentJobId },
    );

    if (error) {
        throw new Error(`recordChildFailedOnParent failed: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
        throw new Error('recordChildFailedOnParent returned no row');
    }

    return mapJobRow(row as JobRow);
}