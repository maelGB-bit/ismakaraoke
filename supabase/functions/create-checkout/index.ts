import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planId, couponCode, customerEmail, customerName, customerPhone, instanceName } = await req.json();
    logStep("Received request", { planId, couponCode, customerEmail, instanceName });

    if (!planId || !customerEmail || !customerName || !instanceName) {
      throw new Error("Missing required fields: planId, customerEmail, customerName, instanceName");
    }

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found or inactive");
    }

    logStep("Plan found", { planName: plan.name, priceId: plan.stripe_price_id });

    // Free plan - redirect directly without payment
    if (plan.is_free) {
      throw new Error("Free plan does not require payment. Use the trial registration flow.");
    }

    if (!plan.stripe_price_id) {
      throw new Error("Plan has no Stripe price configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Validate coupon if provided
    let stripeCouponId: string | undefined;
    let couponDetails: { id: string; discount_value: number; discount_type: string } | null = null;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabaseClient
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        throw new Error("Invalid or expired coupon code");
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        throw new Error("Coupon is not yet valid");
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        throw new Error("Coupon has expired");
      }

      // Check max uses
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new Error("Coupon has reached maximum usage limit");
      }

      logStep("Coupon validated", { code: coupon.code, discountValue: coupon.discount_value });

      // Use Stripe coupon if available, otherwise create one
      if (coupon.stripe_coupon_id) {
        stripeCouponId = coupon.stripe_coupon_id;
      } else {
        // Create a Stripe coupon on-the-fly
        const stripeCoupon = await stripe.coupons.create({
          name: coupon.code,
          ...(coupon.discount_type === 'percentage' 
            ? { percent_off: Number(coupon.discount_value) }
            : { amount_off: Number(coupon.discount_value), currency: 'brl' }),
          duration: 'once',
        });
        stripeCouponId = stripeCoupon.id;
        
        // Update the coupon with the Stripe ID
        await supabaseClient
          .from('discount_coupons')
          .update({ stripe_coupon_id: stripeCoupon.id })
          .eq('id', coupon.id);
      }

      couponDetails = {
        id: coupon.id,
        discount_value: Number(coupon.discount_value),
        discount_type: coupon.discount_type,
      };
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: plan.is_recurring ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}/app/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/planos`,
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name,
        duration_hours: String(plan.duration_hours),
        customer_name: customerName,
        customer_phone: customerPhone || '',
        instance_name: instanceName,
        coupon_code: couponCode || '',
      },
    };

    // Add discount if coupon is valid
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
