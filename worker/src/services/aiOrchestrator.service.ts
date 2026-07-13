import {
    SYSTEM_PROMPT,
    buildFallbackOutput,
    buildRepairPrompt,
    buildUserPrompt,
    ProductOptimizationOutputSchema,
    type OptimizationPromptInput,
    type ProductOptimizationOutput,
} from '@shopiforge/shared';

import { completeJsonChat } from './groq.client.js';
import { safeJsonParse } from '../utils/safeJsonParse.js';

const MAX_REPAIR_ATTEMPTS = 2;

export interface OptimizeProductInput {
    title: string;
    descriptionHtml: string;
    tags: string[];
    vendor?: string | null;
    productType?: string | null;
    variantsSummary?: Array<{ title: string; price: string; sku?: string }>;
    tone: 'default' | 'premium' | 'casual' | 'luxury';
}

export interface OptimizeProductResult {
    output: ProductOptimizationOutput;
    rawAiOutput: string;
    validationErrors: Record<string, unknown> | null;
    usedFallback: boolean;
    repairAttempts: number;
    processingMs: number;
}


  
interface ValidationSuccess {
    ok: true;
    output: ProductOptimizationOutput;
}

interface ValidationFailure {
    ok: false;
    errors: unknown;
}

function toPromptInput(input: OptimizeProductInput): OptimizationPromptInput {
    return {
        title: input.title,
        descriptionHtml: input.descriptionHtml,
        tags: input.tags,
        vendor: input.vendor,
        productType: input.productType,
        variantsSummary: input.variantsSummary,
        tone: input.tone,
    };
}

function validateParsedOutput(parsed: unknown): ValidationFailure | ValidationSuccess {
    const result = ProductOptimizationOutputSchema.safeParse(parsed);

    if (result.success) {
        return { ok: true, output: result.data };
    }
    return { ok: false, errors: result.error.flatten() };
}

async function requestAndValidate(
    promptInput: OptimizationPromptInput,
    userPrompt: string,
): Promise<
    | { kind: 'success'; output: ProductOptimizationOutput; raw: string }
    | { kind: 'failure'; raw: string ; errors: unknown }
> {

    const raw = await completeJsonChat({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
    });

    const parsed = safeJsonParse(raw);

    if (parsed === null) {
        return {
          kind: 'failure',
          raw,
          errors: { message: 'Response was not valid JSON' },
        };
    }

    const validation = validateParsedOutput(parsed);

    if (validation.ok) {
        return { kind: 'success', output: validation.output, raw };
    }

    return { kind: 'failure', raw, errors: validation.errors };

}

export async function optimizeProductListing(input: OptimizeProductInput,): Promise<OptimizeProductResult> {
    const startedAt = Date.now();
    const promptInput = toPromptInput(input);

    let repairAttempts = 0;
    let lastRaw = '';
    let lastErrors: unknown = null;

    const firstAttempt = await requestAndValidate(promptInput, buildUserPrompt(promptInput),);

    if (firstAttempt.kind === 'success') {
        return {
            output: firstAttempt.output,
            rawAiOutput: firstAttempt.raw,
            validationErrors: null,
            usedFallback: false,
            repairAttempts: 0,
            processingMs: Date.now() - startedAt,
        };
    }

    lastRaw = firstAttempt.raw;
    lastErrors = firstAttempt.errors;

    while (repairAttempts < MAX_REPAIR_ATTEMPTS) {
        repairAttempts += 1;

        const repairPrompt = buildRepairPrompt({
            originalInput: promptInput,
            invalidRaw: lastRaw,
            validationErrors: lastErrors,
        });

        const repairAttempt = await requestAndValidate(promptInput, repairPrompt);

        if (repairAttempt.kind === 'success') {
            return {
                output: repairAttempt.output,
                rawAiOutput: repairAttempt.raw,
                validationErrors: null,
                usedFallback: false,
                repairAttempts,
                processingMs: Date.now() - startedAt,
            };
        }

        lastRaw = repairAttempt.raw;
        lastErrors = repairAttempt.errors;

    }

    const output = buildFallbackOutput(promptInput);

    return {
        output,
        rawAiOutput: lastRaw,
        validationErrors: {
          message: 'Used fallback after repair attempts exhausted',
          lastErrors,
        },
        usedFallback: true,
        repairAttempts,
        processingMs: Date.now() - startedAt,
    };

}

