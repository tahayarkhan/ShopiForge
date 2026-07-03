import type { CompareData, MockProduct } from '../types';

export const mockProducts: MockProduct[] = [
  {
    id: 'prod-001',
    title: 'Classic Cotton T-Shirt',
    descriptionHtml: '<p>A soft everyday cotton t-shirt for casual wear.</p>',
    tags: ['cotton', 't-shirt', 'casual'],
    vendor: 'Northline Apparel',
    productType: 'Shirts',
    status: 'ACTIVE',
  },
  {
    id: 'prod-002',
    title: 'Ceramic Coffee Mug',
    descriptionHtml: '<p>A durable ceramic mug for coffee, tea, and daily use.</p>',
    tags: ['mug', 'ceramic', 'coffee'],
    vendor: 'HomeCraft Co.',
    productType: 'Kitchen',
    status: 'ACTIVE',
  },
  {
    id: 'prod-003',
    title: 'Leather Travel Wallet',
    descriptionHtml: '<p>A compact wallet designed for passports, cards, and travel essentials.</p>',
    tags: ['wallet', 'leather', 'travel'],
    vendor: 'Trail & Hide',
    productType: 'Accessories',
    status: 'DRAFT',
  },
];

export const mockCompareData: CompareData[] = [
  {
    productId: 'prod-001',
    before: {
      title: 'Classic Cotton T-Shirt',
      descriptionHtml: '<p>A soft everyday cotton t-shirt for casual wear.</p>',
      tags: ['cotton', 't-shirt', 'casual'],
    },
    after: {
      title: 'Premium Everyday Cotton T-Shirt',
      descriptionHtml:
        '<p>Upgrade your daily wardrobe with a soft, breathable cotton t-shirt designed for comfort, easy layering, and everyday style.</p>',
      tags: ['premium cotton', 'everyday essentials', 'casual style', 'soft t-shirt'],
      bulletPoints: [
        'Soft cotton fabric for all-day comfort',
        'Easy to layer under jackets or wear alone',
        'Classic fit designed for everyday use',
        'Simple style that pairs with jeans, shorts, or chinos',
      ],
      seoKeywords: ['cotton t-shirt', 'everyday t-shirt', 'casual shirt', 'soft tee'],
    },
  },
  {
    productId: 'prod-002',
    before: {
      title: 'Ceramic Coffee Mug',
      descriptionHtml: '<p>A durable ceramic mug for coffee, tea, and daily use.</p>',
      tags: ['mug', 'ceramic', 'coffee'],
    },
    after: {
      title: 'Durable Ceramic Coffee Mug for Daily Brews',
      descriptionHtml:
        '<p>Enjoy your morning coffee or evening tea in a sturdy ceramic mug made for everyday comfort, clean style, and reliable use.</p>',
      tags: ['ceramic mug', 'coffee cup', 'tea mug', 'kitchen essentials'],
      bulletPoints: [
        'Durable ceramic construction for daily use',
        'Comfortable handle for hot drinks',
        'Simple design fits any kitchen or desk setup',
        'Great for coffee, tea, cocoa, and more',
      ],
      seoKeywords: ['ceramic coffee mug', 'daily coffee cup', 'tea mug', 'kitchen mug'],
    },
  },
  {
    productId: 'prod-003',
    before: {
      title: 'Leather Travel Wallet',
      descriptionHtml:
        '<p>A compact wallet designed for passports, cards, and travel essentials.</p>',
      tags: ['wallet', 'leather', 'travel'],
    },
    after: {
      title: 'Compact Leather Travel Wallet for Passports and Cards',
      descriptionHtml:
        '<p>Keep passports, cards, and travel essentials organized with a compact leather wallet built for trips, airport days, and everyday carry.</p>',
      tags: ['leather wallet', 'travel wallet', 'passport holder', 'travel accessories'],
      bulletPoints: [
        'Compact layout for passports, cards, and documents',
        'Leather finish with a polished travel-ready look',
        'Helps keep essentials organized on the go',
        'Ideal for business trips, vacations, and daily carry',
      ],
      seoKeywords: ['leather travel wallet', 'passport wallet', 'travel organizer', 'card holder'],
    },
  },
];

export function getCompareData(productId: string): CompareData | undefined {
  return mockCompareData.find((item) => item.productId === productId);
}