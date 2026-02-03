-- Add visible_on_site column to discount_coupons table
ALTER TABLE public.discount_coupons 
ADD COLUMN visible_on_site boolean NOT NULL DEFAULT false;

-- Add a comment explaining the column
COMMENT ON COLUMN public.discount_coupons.visible_on_site IS 'If true, this coupon will be displayed on the website and auto-applied at checkout. Only one coupon can be visible at a time.';