CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_product_id text NOT NULL,
  shopify_gid text NOT NULL,
  title text NOT NULL,
  description_html text,
  tags text[] NOT NULL DEFAULT '{}',
  vendor text,
  product_type text,
  status text,
  handle text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  shopify_updated_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_products_shop_shopify_product_id
    UNIQUE (shop_id, shopify_product_id)
);

CREATE INDEX idx_products_shop_updated_at_desc
  ON products (shop_id, updated_at DESC);

CREATE INDEX idx_products_shop_title
  ON products (shop_id, title);

