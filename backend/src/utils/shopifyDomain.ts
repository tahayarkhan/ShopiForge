const SHOPIFY_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export function normalizeShopDomain(input: string): string {
    const trimmed = input.trim();

    if (!trimmed) {
        throw new Error('Shop domain is required');
    }

    if (/^https?:\/\//i.test(trimmed)) {
        throw new Error('Shop domain must not include protocol');
    }

    if (/[\s/?#]/.test(trimmed)) {
        throw new Error('Invalid shop domain format');
    }

    let domain = trimmed.toLowerCase();

    if (!domain.includes('.')) {
        domain = `${domain}.myshopify.com`;
    }

    if (!SHOPIFY_DOMAIN_REGEX.test(domain)) {
        throw new Error('Shop domain must be a valid myshopify.com store');
    }

    return domain;

}