export const SYSTEM_PROMPT = `You are ShopiForge, an expert e-commerce copywriter and SEO specialist for Shopify products.

RULES:
1. Respond with ONLY valid JSON matching the schema below. No markdown, no prose, no code fences.
2. descriptionHtml must be valid HTML using only: <p>, <ul>, <li>, <strong>, <em>, <br>.
3. title must be SEO-optimized, under 150 characters, no ALL CAPS.
4. bulletPoints focus on benefits, not features. 3-7 items.
5. tags must be lowercase, no duplicates, Shopify-searchable.
6. Never invent specifications (materials, dimensions, certifications) not present in input.
7. If input data is sparse, improve what exists without fabricating facts.

JSON SCHEMA:
{
  "title": "string",
  "descriptionHtml": "string",
  "bulletPoints": ["string"],
  "tags": ["string"],
  "seoKeywords": ["string"],
  "toneApplied": "default|premium|casual|luxury",
  "confidence": 0.0-1.0
}`;


export interface OptimizationPromptInput {
    title: string;
    descriptionHtml: string;
    tags: string[];
    vendor?: string | null;
    productType?: string | null;
    variantsSummary?: Array<{ title: string; price: string; sku?: string }>;
    tone: 'default' | 'premium' | 'casual' | 'luxury';
}

export function buildUserPrompt(input: OptimizationPromptInput): string {
    const tags = input.tags.length > 0 ? input.tags.join(', ') : 'none';
    const variants = input.variantsSummary?.length
      ? input.variantsSummary
          .map((v) => `${v.title} / ${v.price}${v.sku ? ` (${v.sku})` : ''}`)
          .join('; ')
      : 'none';
  
    let prompt = `Optimize this Shopify product listing.
  
  TONE: ${input.tone}
  Tone guide:
  - premium: refined, authoritative, quality-focused
  - casual: friendly, conversational, approachable
  - luxury: exclusive, elegant, aspirational
  - default: balanced professional e-commerce
  
  PRODUCT INPUT:
  Title: ${input.title}
  Description HTML: ${input.descriptionHtml || '(empty)'}
  Tags: ${tags}
  Vendor: ${input.vendor ?? 'unknown'}
  Product Type: ${input.productType ?? 'unknown'}
  Variants: ${variants}
  
  Return JSON only.`;
  
    const plainDescription = input.descriptionHtml.replace(/<[^>]*>/g, '').trim();
    if (plainDescription.length < 20) {
      prompt += `
  
  NOTE: Description is minimal. Write a compelling description using ONLY title, tags, vendor, and product type. Do not invent specs.`;
    }
  
    return prompt;
}


const MAX_REPAIR_RAW_LENGTH = 4000;

function truncateRaw(raw: string, maxLength: number): string {
    const trimmed = raw.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return `${trimmed.slice(0, maxLength)}\n...[truncated]`;
}



export function buildRepairPrompt(params: {
    originalInput: OptimizationPromptInput;
    invalidRaw: string;
    validationErrors: unknown;
}): string {
    
    const { originalInput, invalidRaw, validationErrors } = params;
    const errorsJson = JSON.stringify(validationErrors, null, 2);

    const truncatedRaw = truncateRaw(invalidRaw, MAX_REPAIR_RAW_LENGTH);

    return `
    Your previous response was invalid JSON or failed schema validation.
    VALIDATION ERRORS:
    ${errorsJson}
    INVALID RESPONSE:
    ${truncatedRaw}
    ORIGINAL PRODUCT INPUT:
    ${buildUserPrompt(originalInput)}
    Fix every validation error. Return corrected JSON only. No markdown, no code fences, no extra text.
    `;

}