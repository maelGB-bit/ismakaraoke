-- Create subscription_plans table for admin to manage plans
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_amount integer NOT NULL, -- in cents
  price_currency text NOT NULL DEFAULT 'brl',
  duration_hours integer NOT NULL, -- duration in hours
  stripe_price_id text, -- null for free plan
  stripe_product_id text, -- null for free plan
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_interval text, -- 'month' or 'year'
  is_active boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create discount_coupons table
CREATE TABLE public.discount_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value numeric NOT NULL, -- percentage (0-100) or fixed amount in cents
  stripe_coupon_id text,
  max_uses integer, -- null = unlimited
  current_uses integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payment_records table to track payments
CREATE TABLE public.payment_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  user_email text NOT NULL,
  user_name text,
  user_phone text,
  plan_id uuid REFERENCES public.subscription_plans(id),
  plan_name text NOT NULL,
  amount_paid integer NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  coupon_code text,
  discount_amount integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  instance_created boolean NOT NULL DEFAULT false,
  instance_id uuid,
  payment_type text NOT NULL DEFAULT 'one_time', -- 'one_time' or 'subscription'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (is_admin());

-- Discount coupons policies  
CREATE POLICY "Anyone can view active coupons by code"
  ON public.discount_coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
  ON public.discount_coupons FOR ALL
  USING (is_admin());

-- Payment records policies
CREATE POLICY "Users can view own payment records"
  ON public.payment_records FOR SELECT
  USING (user_email = get_user_email());

CREATE POLICY "Admins can view all payment records"
  ON public.payment_records FOR SELECT
  USING (is_admin());

CREATE POLICY "Service can insert payment records"
  ON public.payment_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update payment records"
  ON public.payment_records FOR UPDATE
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();