import { env } from '../config/env.js';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqChatCompletionResponse {
    choices?: Array<{
        message?: {
            content?: string | null ;
        };
    }>;
    error?: {
        message?: string;
    };
}

export class GroqClientError extends Error {
    constructor(
      message: string,
      public readonly statusCode?: number,
    ) {
      super(message);
      this.name = 'GroqClientError';
    }
}

export async function completeJsonChat(
    params: {
        systemPrompt: string;
        userPrompt: string;
    }
):  Promise<string> {

    const { systemPrompt, userPrompt } = params;

    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL,
        {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: env.GROQ_MODEL, 
            temperature: env.GROQ_TEMPERATURE,
            max_tokens: env.GROQ_MAX_TOKENS,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ] satisfies GroqChatMessage[],
        }),

    });

    const body = (await response.json()) as GroqChatCompletionResponse;

    if (!response.ok) {
        const message =
          body.error?.message ??
          `Groq request failed with status ${response.status}`;
        throw new GroqClientError(message, response.status);
    }

    const content = body.choices?.[0]?.message?.content?.trim();

    if (!content) {
        throw new GroqClientError('Groq returned an empty response');
    }

    return content;
}

