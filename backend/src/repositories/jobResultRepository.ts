import { supabase } from '../lib/supabase.js';
import {
  mapJobResultRow,
  type JobResultRow,
} from '../mappers/jobResultMapper.js';
import type {
  JobResult,
  ProductInputSnapshot,
  ProductOptimizationOutput,
} from '@shopiforge/shared';


export interface CreateJobResultInput {
    jobId: string;
    productId: string;
    inputSnapshot: ProductInputSnapshot;
}

export interface CompleteJobResultInput {
    jobResultId: string;
    rawAiOutput: string;
    output: ProductOptimizationOutput;
    validationErrors: Record<string, unknown> | null;
    repairAttempts: number;
    processingMs: number;
}

export async function createJobResult(input: CreateJobResultInput): Promise<JobResult> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('job_results')
        .insert({
            job_id: input.jobId,
            product_id: input.productId,
            status: 'pending',
            input_snapshot: input.inputSnapshot,
            shopify_push_status: 'skipped',
            retry_count: 0,
            created_at: now,
            updated_at: now,
        })
        .select('*')
        .single();

    if (error) {
        throw new Error(`createJobResult failed: ${error.message}`);
    }

    return mapJobResultRow(data as JobResultRow);
}

export async function markJobResultProcessing(jobResultId: string): Promise<JobResult> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('job_results')
        .update({
            status: 'processing',
            updated_at: now,
        })
        .eq('id', jobResultId)
        .select('*')
        .single();
    
    if (error) {
        throw new Error(`markJobResultProcessing failed: ${error.message}`);
    }

    return mapJobResultRow(data as JobResultRow);
}

export async function completeJobResult(input: CompleteJobResultInput): Promise<JobResult> {
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

export async function findLatestCompletedResultForProduct( productId: string ): Promise<JobResult | null> {
    const { data, error } = await supabase
        .from('job_results')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    

    if (error) {
        throw new Error(
            `findLatestCompletedResultForProduct failed: ${error.message}`,
        );
    }

    return data ? mapJobResultRow(data as JobResultRow) : null;

}

export async function findJobResultForCompare(
    productId: string,
    jobId?: string,
  ): Promise<JobResult | null> {
    if (jobId) {
      const { data, error } = await supabase
        .from('job_results')
        .select('*')
        .eq('product_id', productId)
        .eq('job_id', jobId)
        .eq('status', 'completed')
        .maybeSingle();
  
      if (error) {
        throw new Error(`findJobResultForCompare failed: ${error.message}`);
      }
  
      return data ? mapJobResultRow(data as JobResultRow) : null;
    }
  
    return findLatestCompletedResultForProduct(productId);
}

export async function findActiveJobResultForProduct(productId: string): Promise<JobResult | null> {
    const { data, error } = await supabase
        .from('job_results')
        .select('*')
        .eq('product_id', productId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) {
        throw new Error(
            `findActiveJobResultForProduct failed: ${error.message}`,
        );
    }

    return data ? mapJobResultRow(data as JobResultRow) : null;

}