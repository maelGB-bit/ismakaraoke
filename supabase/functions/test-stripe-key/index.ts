import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-STRIPE-KEY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized - Admin access required");
    }

    logStep("Admin verified", { userId: userData.user.id });

    const { key } = await req.json();

    if (!key) {
      throw new Error("Missing Stripe key to test");
    }

    // Validate key format
    if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Formato inválido. A chave deve começar com sk_test_ ou sk_live_' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    logStep("Testing Stripe key", { keyPrefix: key.substring(0, 12) });

    try {
      const stripe = new Stripe(key, {
        apiVersion: "2025-08-27.basil",
      });

      // Try to retrieve balance - a simple API call to verify the key works
      const balance = await stripe.balance.retrieve();
      
      const isLive = key.startsWith('sk_live_');
      const mode = isLive ? 'Produção' : 'Teste';
      
      logStep("Stripe key valid", { mode, available: balance.available.length });

      return new Response(
        JSON.stringify({ 
          valid: true, 
          message: `Chave válida! Modo: ${mode}. Conta verificada com sucesso.`,
          mode: isLive ? 'live' : 'test',
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (stripeError) {
      logStep("Stripe key invalid", { error: String(stripeError) });
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Chave inválida ou sem permissão para acessar a conta Stripe.' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
