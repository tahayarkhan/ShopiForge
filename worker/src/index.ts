import './loadEnv.js';
import { parseEnv } from '@shopiforge/shared';
// Ensure processor module typechecks when imported:
import { processOptimizeProductJob } from './processors/optimizeProduct.processor.js';

const env = parseEnv();

console.log(`[worker] started (${env.NODE_ENV})`);
console.log('[worker] processor loaded — BullMQ Worker registration is Step 6');

void processOptimizeProductJob; // silence unused until Step 6 wires Worker