import type { ProductImage, VariantSummary } from '@shopiforge/shared';

export interface ShopifyClientConfig {
    shopifyDomain: string;
    accessToken: string;
    apiVersion: string;
}

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

const MAX_PRODUCTS = 500;

const PRODUCTS_FOR_SYNC_QUERY = `
    query ProductsForSync($cursor: String) {
        products (first: 50, after: $cursor) {
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

`
function graphqlEndpoint(config: ShopifyClientConfig): string {
    return `https://${config.shopifyDomain}/admin/api/${config.apiVersion}/graphql.json`;
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

export async function fetchAllProducts( config: ShopifyClientConfig ): Promise<ShopifyProductForSync[]> {
    const results: ShopifyProductForSync[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
        type Page = {
            products: {
                pageInfo: { hasNextPage: boolean; endCursor: string | null };
                nodes: GraphQLProductNode[];
            };
        };
        
        const data: any = await executeGraphQL<Page>(config, PRODUCTS_FOR_SYNC_QUERY, {
            cursor,
        });

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