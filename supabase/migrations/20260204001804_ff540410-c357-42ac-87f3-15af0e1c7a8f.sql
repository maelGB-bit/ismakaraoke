-- Add live mode stripe price ID to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id_live TEXT;

-- Add stripe mode setting to secure_secrets
-- We'll store STRIPE_MODE as 'test' or 'live'
INSERT INTO public.secure_secrets (key_name, encrypted_value, updated_at)
VALUES ('STRIPE_MODE', 'test', now())
ON CONFLICT (key_name) DO NOTHING;

-- Add separate keys for test and live modes
-- Rename existing STRIPE_SECRET_KEY to STRIPE_SECRET_KEY_LIVE if it starts with sk_live_
-- For now, just add the test key field
INSERT INTO public.secure_secrets (key_name, encrypted_value, updated_at)
VALUES ('STRIPE_SECRET_KEY_TEST', '', now())
ON CONFLICT (key_name) DO NOTHING;

INSERT INTO public.secure_secrets (key_name, encrypted_value, updated_at)
VALUES ('STRIPE_SECRET_KEY_LIVE', '', now())
ON CONFLICT (key_name) DO NOTHING;

INSERT INTO public.secure_secrets (key_name, encrypted_value, updated_at)
VALUES ('STRIPE_WEBHOOK_SECRET_TEST', '', now())
ON CONFLICT (key_name) DO NOTHING;

INSERT INTO public.secure_secrets (key_name, encrypted_value, updated_at)
VALUES ('STRIPE_WEBHOOK_SECRET_LIVE', '', now())
ON CONFLICT (key_name) DO NOTHING;