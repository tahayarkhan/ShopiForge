import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    FRONTEND_URL: z.string().url(),
    API_URL: z.string().url(),
    DATABASE_URL: z.string().url(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    SHOPIFY_API_KEY: z.string().min(1),
    SHOPIFY_API_SECRET: z.string().min(1),
    SHOPIFY_SCOPES: z.string().default('read_products'),
    SHOPIFY_APP_URL: z.string().url(),
    SHOPIFY_API_VERSION: z.string().default('2026-07'),
    SESSION_SECRET: z.string().min(32),
    ENCRYPTION_KEY_BASE64: z.string().refine((value) => {
        return Buffer.from(value, 'base64').length === 32;
    }, 'ENCRYPTION_KEY_BASE64 must decode to 32 bytes'),
    // SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().min(1),
    GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
    GROQ_MAX_TOKENS: z.coerce.number().default(2048),
    GROQ_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
    source: Record<string, string | undefined> = process.env  
): Env {
    const result = envSchema.safeParse(source);
    if (!result.success) {
      console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
      process.exit(1);
    }
    return result.data;
}