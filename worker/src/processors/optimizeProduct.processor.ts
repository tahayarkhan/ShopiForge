import type { OptimizeProductJobPayload } from '@shopiforge/shared';
import {
  claimJobForProcessing,
  markJobCompleted,
  markJobFailed,
} from '../repositories/jobRepository.js';
import {
  claimJobResultForProcessing,
  completeJobResult,
  failJobResult,
  findJobResultById,
} from '../repositories/jobResultRepository.js';
import { optimizeProductListing } from '../services/aiOrchestrator.service.js';


export async function processOptimizeProductJob(payload: OptimizeProductJobPayload): Promise<void> {
    const { jobId, jobResultId, tone } = payload;

    const claimedJob = await claimJobForProcessing(jobId);
    const claimedResult = await claimJobResultForProcessing(jobResultId);

    if (!claimedJob || !claimedResult) {
        console.log(
            `[worker] skip job ${jobId}: already claimed or terminal`,
          );
        return;
    }

    const jobResult =
        claimedResult.inputSnapshot != null
        ? claimedResult
        : await findJobResultById(jobResultId);
    
    
    if (!jobResult?.inputSnapshot) {
        throw new Error(`Missing input_snapshot for jobResult ${jobResultId}`);
    }
    
    const snapshot = jobResult.inputSnapshot;

    try {
        const result = await optimizeProductListing({
            title: snapshot.title,
            descriptionHtml: snapshot.descriptionHtml ?? '',
            tags: snapshot.tags ?? [],
            tone,
        });

        await completeJobResult({
            jobResultId,
            rawAiOutput: result.rawAiOutput,
            output: result.output,
            validationErrors: result.validationErrors,
            repairAttempts: result.repairAttempts,
            processingMs: result.processingMs,
        });

        await markJobCompleted(jobId);
    
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Product optimization failed';
        throw err instanceof Error ? err : new Error(message);

    }

}