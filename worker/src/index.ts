import './loadEnv.js';
import { parseEnv } from '@shopiforge/shared';

const env = parseEnv();

console.log(`[worker] started (${env.NODE_ENV})`);
console.log('[worker] queue processors not configured — Phase 4');