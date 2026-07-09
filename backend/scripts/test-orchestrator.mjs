import '../dist/loadEnv.js';
import { optimizeProductListing } from '../dist/services/aiOrchestrator.service.js';

const result = await optimizeProductListing({
    title: 'Classic Cotton T-Shirt',
    descriptionHtml: '<p>A soft everyday cotton t-shirt for casual wear.</p>',
    tags: ['cotton', 't-shirt', 'casual'],
    vendor: 'Northline Apparel',
    productType: 'Shirts',
    variantsSummary: [{ title: 'Default', price: '24.99' }],
    tone: 'default',
})

console.log('usedFallback:', result.usedFallback);
console.log('repairAttempts:', result.repairAttempts);
console.log('processingMs:', result.processingMs);
console.log('output.title:', result.output.title);
console.log('bulletPoints:', result.output.bulletPoints);