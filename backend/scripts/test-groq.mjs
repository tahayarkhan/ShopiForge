import '../dist/loadEnv.js';
import { completeJsonChat } from '../dist/services/groq.client.js';

const raw = await completeJsonChat({
    systemPrompt: 'Respond with ONLY valid JSON: { "message": "string" }',
    userPrompt: 'Return JSON with message set to "hello from groq".',
});

console.log('Raw response:', raw);

const parsed = JSON.parse(raw);

console.log('Parsed:', parsed);
