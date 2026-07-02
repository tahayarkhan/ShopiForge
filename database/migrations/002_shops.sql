CREATE TABLE shops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_domain text UNIQUE NOT NULL,
    shopify_shop_id text UNIQUE,
    access_token_encrypted text NOT NULL,
    access_token_iv text NOT NULL,
    access_token_tag text NOT NULL,
    scopes text[] NOT NULL,
    plan text NOT NULL DEFAULT 'free',
    is_active boolean NOT NULL DEFAULT true,
    installed_at timestamptz,
    uninstalled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shops_shopify_domain ON shops (shopify_domain);


CREATE INDEX idx_shops_is_active_true
  ON shops (is_active)
  WHERE is_active = true;

