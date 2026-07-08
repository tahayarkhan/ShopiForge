export function normalizeShopInput(input: string): string {
    const trimmed = input.trim().toLowerCase();
  
    if (!trimmed) {
      throw new Error('Shop domain is required');
    }
  
    if (/^https?:\/\//i.test(trimmed)) {
      throw new Error('Do not include https://');
    }
  
    if (/[\s/?#]/.test(trimmed)) {
      throw new Error('Invalid shop domain');
    }
  
    let domain = trimmed;
  
    if (!domain.includes('.')) {
      domain = `${domain}.myshopify.com`;
    }
  
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
      throw new Error('Must be a valid myshopify.com store');
    }
  
    return domain;
}