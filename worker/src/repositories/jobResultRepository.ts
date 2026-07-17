import type {
    JobResult,
    ProductOptimizationOutput,
  } from '@shopiforge/shared';
  import { supabase } from '../lib/supabase.js';
  import {
    mapJobResultRow,
    type JobResultRow,
} from '../mappers/jobResultMapper.js';

export async function claimJobResultForProcessing(jobResultId: string,): Promise<JobResult | null> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('job_results')
        .update({
        status: 'processing',
        updated_at: now,
        })
        .eq('id', jobResultId)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();
    
    if (error) {
        throw new Error(`claimJobResultForProcessing failed: ${error.message}`);
    }

    return data ? mapJobResultRow(data as JobResultRow) : null;

}

export async function findJobResultById(jobResultId: string,): Promise<JobResult | null> {
    
    const { data, error } = await supabase
        .from('job_results')
        .select('*')
        .eq('id', jobResultId)
        .maybeSingle();

    if (error) {
        throw new Error(`findJobResultById failed: ${error.message}`);
    }
    
    return data ? mapJobResultRow(data as JobResultRow) : null;

}

export async function completeJobResult(input: {
    jobResultId: string;
    rawAiOutput: string;
    output: ProductOptimizationOutput;
    validationErrors: Record<string, unknown> | null;
    repairAttempts: number;
    processingMs: number;
}): Promise<JobResult> {
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
        .from('job_results')
        .update({
            status: 'completed',
            raw_ai_output: input.rawAiOutput,
            output: input.output,
            validation_errors: input.validationErrors,
            retry_count: input.repairAttempts,
            processing_ms: input.processingMs,
            updated_at: now,
        })
        .eq('id', input.jobResultId)
        .select('*')
        .single();
    
    if (error) {
        throw new Error(`completeJobResult failed: ${error.message}`);
    }


    return mapJobResultRow(data as JobResultRow);

}

export async function failJobResult(
    jobResultId: string,
    errorMessage: string,
): Promise<JobResult> {

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('job_results')
        .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: now,
        })
        .eq('id', jobResultId)
        .select('*')
        .single();
  
    if (error) {
        throw new Error(`failJobResult failed: ${error.message}`);
    }
    
    return mapJobResultRow(data as JobResultRow);
}

export async function markShopifyPushPending(jobResultId: string): Promise<void> {

    const now = new Date().toISOString;

    const { error } = await supabase
        .from('job_results')
        .update({
            shopify_push_status: 'pending',
            shopify_push_error: null,
            updated_at: now,
        })
        .eq('id', jobResultId);

    if (error) {
        throw new Error(`markShopifyPushPending failed: ${error.message}`);
    }

}

export async function markShopifyPushPushed(jobResultId: string): Promise<void> {

    const now = new Date().toISOString;

    const { error } = await supabase
        .from('job_results')
        .update({
            shopify_push_status: 'pushed',
            shopify_push_error: null,
            updated_at: now,
        })
        .eq('id', jobResultId);

    if (error) {
        throw new Error(`markShopifyPushPushed failed: ${error.message}`);
    }

}

export async function markShopifyPushFailed(
    jobResultId: string,
    errorMessage: string,
): Promise<void> {
    
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('job_results')
      .update({
        shopify_push_status: 'failed',
        shopify_push_error: errorMessage,
        updated_at: now,
      })
      .eq('id', jobResultId);
    
    if (error) {
      throw new Error(`markShopifyPushFailed failed: ${error.message}`);
    }
}

export async function markShopifyPushSkipped(jobResultId: string): Promise<void> {
    
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('job_results')
      .update({
        shopify_push_status: 'skipped',
        shopify_push_error: null,
        updated_at: now,
      })
      .eq('id', jobResultId);
    
    if (error) {
      throw new Error(`markShopifyPushSkipped failed: ${error.message}`);
    }

}