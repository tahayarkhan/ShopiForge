import type { ProductOptimizationOutput } from '@shopiforge/shared';
import type { ProductImage, VariantSummary } from '@shopiforge/shared';

const MAX_PRODUCTS = 500;

export interface ShopifyClientConfig {
    shopifyDomain: string;
    accessToken: string;
    apiVersion: string;
}

export interface ShopifyProductUpdateInput {
    id: string; // Shopify GID
    title: string;
    descriptionHtml: string;
    tags: string[];
}

type ThrottleState = {
    currentlyAvailable: number;
    restoreRate: number; // points per second
    lastUpdatedAt: number; // Date.now()
};

export interface ShopifyProductForSync {
    shopifyProductId: string;
    shopifyGid: string;
    title: string;
    descriptionHtml: string | null;
    tags: string[];
    vendor: string | null;
    productType: string | null;
    status: string | null;
    handle: string | null;
    images: ProductImage[];
    variantsSummary: VariantSummary[];
    shopifyUpdatedAt: string | null;
}

export function shopifyGidToId(gid: string): string {
    const segment = gid.split('/').pop();
    if (!segment) {
      throw new Error(`Invalid Shopify product GID: ${gid}`);
    }
    return segment;
}


interface GraphQLProductNode {
    id: string;
    title: string;
    descriptionHtml: string | null;
    tags: string[];
    vendor: string | null;
    productType: string | null;
    status: string | null;
    handle: string | null;
    updatedAt: string | null;
    images: { nodes: Array<{ id: string; url: string; altText: string | null }> };
    variants: {
      nodes: Array<{ id: string; title: string; sku: string | null; price: string }>;
    };
}

function mapGraphQLProduct(node: GraphQLProductNode): ShopifyProductForSync {
    return {
      shopifyGid: node.id,
      shopifyProductId: shopifyGidToId(node.id),
      title: node.title,
      descriptionHtml: node.descriptionHtml,
      tags: node.tags ?? [],
      vendor: node.vendor,
      productType: node.productType,
      status: node.status,
      handle: node.handle,
      shopifyUpdatedAt: node.updatedAt,
      images: node.images.nodes.map((img) => ({
        url: img.url,
        altText: img.altText ?? undefined,
        shopifyMediaId: shopifyGidToId(img.id),
      })),
      variantsSummary: node.variants.nodes.map((v) => ({
        id: shopifyGidToId(v.id),
        title: v.title,
        price: v.price,
        sku: v.sku ?? undefined,
      })),
    };
}

async function executeGraphQL <T>(config: ShopifyClientConfig, query: string, variables:Record<string, unknown>): Promise<T> {
    const response  = await fetch(graphqlEndpoint(config), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': config.accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`Shopify GraphQL request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
        throw new Error(`Shopify GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
    }
    if (!json.data) {
        throw new Error('Shopify GraphQL returned no data');
    }

    return json.data;
}


function graphqlEndpoint(config: ShopifyClientConfig): string {
    return `https://${config.shopifyDomain}/admin/api/${config.apiVersion}/graphql.json`;
}

const PRODUCT_UPDATE_MUTATION = `

    mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
            product {
                id
                title
                descriptionHtml
                tags
                updatedAt
            }
            userErrors {
                field
                message
            }
        }
    }

`;



export function mapAiOutputToShopifyProductUpdate(args: {
    shopifyGid: string,
    output: Pick<
        ProductOptimizationOutput,
        'title' | 'descriptionHtml' | 'tags'
    >;
}): ShopifyProductUpdateInput {
    return {
        id: args.shopifyGid,
        title: args.output.title,
        descriptionHtml: args.output.descriptionHtml,
        tags: args.output.tags,
    };
}

const throttleByShop = new Map<string, ThrottleState>();

const DEFAULT_AVAILABLE = 1000;
const DEFAULT_RESTORE = 50;
const PRODUCT_UPDATE_ESTIMATED_COST = 10; // safe guess; refine from responses

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


function estimateAvailable(state: ThrottleState, now: number): number {
    const elapsedSec = (now - state.lastUpdatedAt) / 1000;
    const restored = elapsedSec * state.restoreRate;
    return Math.min(
        DEFAULT_AVAILABLE,
        state.currentlyAvailable + restored,
    );
}

async function throttleForShop(
    shopifyDomain: string,
    estimatedCost: number,
): Promise<void> {

    const now = Date.now();

    const state = throttleByShop.get(shopifyDomain) ?? {
        currentlyAvailable: DEFAULT_AVAILABLE,
        restoreRate: DEFAULT_RESTORE,
        lastUpdatedAt: now,
    };

    const available = estimateAvailable(state, now);

    if (available < estimatedCost) {
        const deficit = estimatedCost - available;
        const waitMs = Math.min(
            2000,
            Math.ceil((deficit / state.restoreRate) * 1000),
        );
        await sleep(Math.max(waitMs, 50));
    }
}

function rememberCost(
    shopifyDomain: string,
    cost: {
        currentlyAvailable?: number;
        restoreRate?: number;
    },
): void {
    throttleByShop.set(shopifyDomain, {
        currentlyAvailable: cost.currentlyAvailable ?? DEFAULT_AVAILABLE,
        restoreRate: cost.restoreRate ?? DEFAULT_RESTORE,
        lastUpdatedAt: Date.now(),
    });
}

async function withShopifyRetries<T>(fn: () => Promise<T>): Promise<T> {
    const delays = [1000, 2000, 4000]; // ms
    let lastError: unknown;
  
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        const isThrottle =
          message.includes('429') ||
          message.toLowerCase().includes('throttl');
  
        if (!isThrottle || attempt === delays.length) {
          throw err;
        }
  
        await sleep(delays[attempt]!);
      }
    }
  
    throw lastError;
}

async function executeGraphQLWithCost<T>(
    config: ShopifyClientConfig,
    query: string,
    variables: Record<string, unknown>,
): Promise<{
    data: T;
    cost?: {
      throttleStatus?: {
        currentlyAvailable?: number;
        restoreRate?: number;
      };
    };
}> {

    const response = await fetch(graphqlEndpoint(config), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (response.status === 429) {
        throw new Error('Shopify GraphQL request failed: 429');
      }

    if (!response.ok) {
        throw new Error(`Shopify GraphQL request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
        extensions?: {
          cost?: {
            throttleStatus?: {
              currentlyAvailable?: number;
              restoreRate?: number;
            };
          };
        };
    };

    if (json.errors?.length) {
        throw new Error(
          `Shopify GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`,
        );
    }

    if (!json.data) {
        throw new Error('Shopify GraphQL returned no data');
    }

    return {
        data: json.data,
        cost: json.extensions?.cost,
    };


}



export async function updateProduct(
    config: ShopifyClientConfig,
    input: ShopifyProductUpdateInput,
): Promise<{
    shopifyGid: string;
    title: string;
    descriptionHtml: string | null;
    tags: string[];
    shopifyUpdatedAt: string | null;
}> {

    return withShopifyRetries(async () => {
        await throttleForShop(
            config.shopifyDomain,
            PRODUCT_UPDATE_ESTIMATED_COST,
        );

        type MutationData = {
            productUpdate: {
                product: {
                  id: string;
                  title: string;
                  descriptionHtml: string | null;
                  tags: string[];
                  updatedAt: string | null;
                } | null;
                userErrors: Array<{ field: string[] | null; message: string }>;
            };
        }

        const { data, cost } = await executeGraphQLWithCost<MutationData>(
            config,
            PRODUCT_UPDATE_MUTATION,
            { input },
        );

        if (cost) {
            rememberCost(config.shopifyDomain, {
              currentlyAvailable: cost.throttleStatus?.currentlyAvailable,
              restoreRate: cost.throttleStatus?.restoreRate,
            });
        }

        const payload = data.productUpdate;

        if (payload.userErrors?.length) {
            throw new Error(
              `Shopify productUpdate userErrors: ${payload.userErrors
                .map((e) => e.message)
                .join('; ')}`,
            );
        }

        if (!payload.product) {
            throw new Error('Shopify productUpdate returned no product');
        }
      

        return {
            shopifyGid: payload.product.id,
            title: payload.product.title,
            descriptionHtml: payload.product.descriptionHtml,
            tags: payload.product.tags ?? [],
            shopifyUpdatedAt: payload.product.updatedAt,
        };
    });
}

const PRODUCTS_FOR_SYNC_QUERY = `
    query ProductsForSync($cursor: String, $query: String) {
        products (first: 50, after: $cursor, query: $query) {
            pageInfo {
                hasNextPage
                endCursor
            }
            nodes {
                id
                title
                descriptionHtml
                tags
                vendor
                productType
                status
                handle
                updatedAt
                images(first: 5) {
                    nodes {
                        id
                        url
                        altText
                    }
                }
                variants(first: 20) {
                    nodes {
                        id
                        title
                        sku
                        price
                    }
                }
            }  
        }
    } 

`;

function buildUpdatedAtQuery(updatedAtMin: string): string {
    return `updated_at:>='${updatedAtMin}'`;
}

export async function fetchAllProducts(
    config: ShopifyClientConfig,
    options?: { updatedAtMin?: string | null },
): Promise<ShopifyProductForSync[]> {

    const results: ShopifyProductForSync[] = [];

    let cursor: string | null = null;
    let hasNextPage = true;

    const queryFilter = 
        options?.updatedAtMin != null && options.updatedAtMin !== ''
        ? buildUpdatedAtQuery(options.updatedAtMin)
        : null;
    
    while (hasNextPage) {
        type Page = {
            products: {
                pageInfo: { hasNextPage: boolean; endCursor: string | null };
                nodes: GraphQLProductNode[];
            }
        }

        const variables: Record<string, unknown> = { cursor };

        if (queryFilter) {
            variables.query = queryFilter;
        }

        const data = await executeGraphQL<Page>(
            config,
            PRODUCTS_FOR_SYNC_QUERY,
            variables,
        );

        const { pageInfo, nodes } = data.products;

        for (const node of nodes) {
            results.push(mapGraphQLProduct(node));
            if (results.length >= MAX_PRODUCTS) {
                return results;
            }

        }

        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
    }

    return results;
    
}