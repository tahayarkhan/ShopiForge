import { z } from "zod";

export const ProductOptimizationOutputSchema = z.object({
    title: z.string().min(10).max(150),
    descriptionHtml: z.string().min(50).max(5000),
    bulletPoints: z.array(z.string().min(5).max(200)).min(3).max(7),
    tags: z.array(z.string().min(2).max(50)).min(3).max(15),
    seoKeywords: z.array(z.string().min(2).max(50)).min(3).max(10),
    toneApplied: z.enum(['default', 'premium', 'casual', 'luxury']),
    confidence: z.number().min(0).max(1),
});


export type ProductOptimizationOutput = z.infer<typeof ProductOptimizationOutputSchema>;
