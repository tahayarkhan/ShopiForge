import type { OptimizeProductJobPayload } from '@shopiforge/shared';
import { env } from '../config/env.js';
import {
  claimJobForProcessing,
  markJobCompleted,
  markParentProcessingIfPending,
  recordChildCompletedOnParent,
} from '../repositories/jobRepository.js';
import {
  claimJobResultForProcessing,
  completeJobResult,
  findJobResultById,
  markShopifyPushFailed,
  markShopifyPushPushed,
  markShopifyPushSkipped,
} from '../repositories/jobResultRepository.js';
import { findProductById, updateProductAfterShopifyPush } from '../repositories/productRepository.js';
import { findActiveShopById } from '../repositories/shopRepository.js';
import { optimizeProductListing } from '../services/aiOrchestrator.service.js';
import { getShopAccessToken } from '../services/shopAccessToken.js';
import {
  mapAiOutputToShopifyProductUpdate,
  updateProduct,
} from '../services/shopifyClient.js';

export async function processOptimizeProductJob(payload: OptimizeProductJobPayload): Promise<void> {
    const { jobId, jobResultId, shopId, productId, tone, parentJobId } = payload;

    const claimedJob = await claimJobForProcessing(jobId);
    const claimedResult = await claimJobResultForProcessing(jobResultId);

    if (!claimedJob || !claimedResult) {
        console.log(
            `[worker] skip job ${jobId}: already claimed or terminal`,
          );
        return;
    }

    if (parentJobId) {
        await markParentProcessingIfPending(parentJobId);
    }


    const jobResult =
        claimedResult.inputSnapshot != null
        ? claimedResult
        : await findJobResultById(jobResultId);
    
    
    if (!jobResult?.inputSnapshot) {
        throw new Error(`Missing input_snapshot for jobResult ${jobResultId}`);
    }
    
    const snapshot = jobResult.inputSnapshot;

    const pushToShopify = claimedJob.pushToShopify;

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


        if (!pushToShopify) {
            await markShopifyPushSkipped(jobResultId);
        } else {
            const latest = await findJobResultById(jobResultId);
            
            if (latest?.shopifyPushStatus === 'pushed') {
                console.log(`[worker] skip push for ${jobResultId}: already pushed`);
            } else {
                try {
                    const product = await findProductById(productId);
                    
                    if (!product) {
                        throw new Error(`Product not found: ${productId}`);
                    }

                    const shop = await findActiveShopById(shopId);

                    if (!shop) {
                        throw new Error(`Shop not found or inactive: ${shopId}`);
                    }

                    const snapshotAt = snapshot.shopifyUpdatedAt ?? null;
                    const currentAt = product.shopifyUpdatedAt ?? null;

                    if (
                        snapshotAt != null &&
                        currentAt != null &&
                        snapshotAt !== currentAt
                    ) {

                        console.warn(
                            `[worker] stale product ${product.id}: snapshot=${snapshotAt} current=${currentAt} — still pushing`,
                        );
                    }

                    const accessToken = getShopAccessToken(shop);
                    
                    const shopifyInput = mapAiOutputToShopifyProductUpdate({
                        shopifyGid: product.shopifyGid,
                        output: result.output,
                    });

                    const updated = await updateProduct(
                        {
                            shopifyDomain: shop.shopifyDomain,
                            accessToken,
                            apiVersion: env.SHOPIFY_API_VERSION,
                        },
                        shopifyInput,
                    );

                    await updateProductAfterShopifyPush({
                        productId: product.id,
                        title: updated.title,
                        descriptionHtml: updated.descriptionHtml,
                        tags: updated.tags,
                        shopifyUpdatedAt: updated.shopifyUpdatedAt,
                    });
                    
                    await markShopifyPushPushed(jobResultId);
                } catch (pushErr) {
                    const message =
                        pushErr instanceof Error
                            ? pushErr.message
                            : 'Shopify push failed';
                    console.error(`[worker] push failed for ${jobResultId}:`, message);
                    await markShopifyPushFailed(jobResultId, message);
                }
            }
        }

        await markJobCompleted(jobId);

        if (parentJobId) {
            await recordChildCompletedOnParent(parentJobId);
        }
    
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Product optimization failed';
        throw err instanceof Error ? err : new Error(message);

    }

}