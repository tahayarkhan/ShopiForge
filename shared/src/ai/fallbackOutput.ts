import type { OptimizationPromptInput } from './prompts.js';
import {
  ProductOptimizationOutputSchema,
  type ProductOptimizationOutput,
} from './productOptimizationSchema.js';

function plainTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function uniqueLowercase(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const normalized = value.trim().toLowerCase();
      if (normalized.length >= 2 && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    }
    return result;
}

function wordsFromText(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 2);
}

function ensureMinCount(
    items: string[],
    min: number,
    max: number,
    fallbackItems: string[],
  ): string[] {
    const result = [...items];
    for (const fallback of fallbackItems) {
      if (result.length >= min) break;
      if (!result.includes(fallback)) {
        result.push(fallback);
      }
    }
    return result.slice(0, max);
}

function buildTitle(input: OptimizationPromptInput): string {
    const base = input.title.trim() || 'Product';
    let title = base.endsWith(' - Optimized') ? base : `${base} - Optimized`;

    if (title.length < 10) {
        title = `${base} — Optimized Listing`;
    }
    return title.slice(0, 150);

}

function buildDescriptionHtml(input: OptimizationPromptInput): string {
    const parts: string[] = [];
    const plainDescription = plainTextFromHtml(input.descriptionHtml);

    if (plainDescription) {
        parts.push(plainDescription);
    }
    if (input.vendor?.trim()) {
        parts.push(`Available from ${input.vendor.trim()}.`);
    }
    if (input.productType?.trim()) {
        parts.push(`Product type: ${input.productType.trim()}.`);
    }
    if (input.tags.length > 0) {
        parts.push(`Related tags: ${input.tags.join(', ')}.`);
    }

    let text = parts.join(' ').trim();
    
    if (!text) {
        text = `${input.title.trim() || 'This product'} is listed in the current store catalog.`;
    }

    while (text.length < 50) {
        text = `${text} Details are based on the existing listing only.`;
    }
    
    return `<p>${text.slice(0, 4990)}</p>`;

}

function buildBulletPoints(input: OptimizationPromptInput): string[] {
    const bullets: string[] = [];
    const plainDescription = plainTextFromHtml(input.descriptionHtml);

    if (plainDescription.length >= 5) {
        bullets.push(plainDescription.slice(0, 200));
    }
    if (input.productType?.trim()) {
        bullets.push(`${input.productType.trim()} category product`);
    }
    if (input.vendor?.trim()) {
    bullets.push(`Offered by ${input.vendor.trim()}`);
    }

    for (const tag of uniqueLowercase(input.tags)) {
        bullets.push(`Tagged as ${tag} in the catalog`);
    }

    if (input.variantsSummary?.length) {
        const variant = input.variantsSummary[0];
        bullets.push(`${variant.title} option listed at ${variant.price}`);
    }

    const padded = ensureMinCount(
        bullets.filter((item) => item.trim().length >= 5),
        3,
        7,
        [
          'Based on the current product listing',
          'Uses only existing catalog information',
          'Ready for merchant review before publishing',
        ],
    );


    return padded.map((item) => item.slice(0, 200));

}


function buildTags(input: OptimizationPromptInput): string[] {
    const fromInput = uniqueLowercase(input.tags);
    const fromTitle = uniqueLowercase(wordsFromText(input.title));
    const fromType = input.productType?.trim()
      ? uniqueLowercase(wordsFromText(input.productType))
      : [];
    const tags = ensureMinCount(
      uniqueLowercase([...fromInput, ...fromTitle, ...fromType]),
      3,
      15,
      ['product', 'listing', 'catalog'],
    );
    return tags.map((tag) => tag.slice(0, 50));
}


function buildSeoKeywords(input: OptimizationPromptInput): string[] {
    const fromTitle = uniqueLowercase(wordsFromText(input.title));
    const fromTags = uniqueLowercase(input.tags);
    const fromType = input.productType?.trim()
      ? uniqueLowercase(wordsFromText(input.productType))
      : [];
    const keywords = ensureMinCount(
      uniqueLowercase([...fromTitle, ...fromTags, ...fromType]),
      3,
      10,
      ['shop product', 'store listing', 'catalog item'],
    );
    return keywords.map((keyword) => keyword.slice(0, 50));
}

export function buildFallbackOutput(
    input: OptimizationPromptInput,
  ): ProductOptimizationOutput {
    const output: ProductOptimizationOutput = {
      title: buildTitle(input),
      descriptionHtml: buildDescriptionHtml(input),
      bulletPoints: buildBulletPoints(input),
      tags: buildTags(input),
      seoKeywords: buildSeoKeywords(input),
      toneApplied: input.tone,
      confidence: 0.3,
    };
    // Safety net: throws in dev if fallback ever drifts from the schema
    return ProductOptimizationOutputSchema.parse(output);
}