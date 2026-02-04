import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for auth
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Use service role to check admin status
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized - Admin access required");
    }

    // All secret keys to check
    const ALL_SECRET_KEYS = [
      'STRIPE_SECRET_KEY_TEST',
      'STRIPE_SECRET_KEY_LIVE',
      'STRIPE_WEBHOOK_SECRET_TEST',
      'STRIPE_WEBHOOK_SECRET_LIVE',
      'STRIPE_MODE',
      'RESEND_API_KEY'
    ];

    // Get secrets status (not the actual values, just metadata)
    const { data: secrets, error: secretsError } = await supabaseAdmin
      .from('secure_secrets')
      .select('key_name, encrypted_value, updated_at, created_at')
      .in('key_name', ALL_SECRET_KEYS);

    if (secretsError) {
      throw new Error(`Failed to fetch secrets: ${secretsError.message}`);
    }

    // Create a map of secret statuses
    const secretsStatus: Record<string, { exists: boolean; updatedAt: string | null; isTestKey: boolean | null }> = {};
    let stripeMode: 'test' | 'live' = 'test';
    
    for (const secret of secrets || []) {
      // Check for STRIPE_MODE
      if (secret.key_name === 'STRIPE_MODE') {
        stripeMode = (secret.encrypted_value === 'live' ? 'live' : 'test');
        continue;
      }

      // Check if the secret has a value (not empty string)
      const hasValue = secret.encrypted_value && secret.encrypted_value.trim().length > 0;

      secretsStatus[secret.key_name] = {
        exists: hasValue,
        updatedAt: secret.updated_at,
        isTestKey: null, // Not needed anymore since we have separate keys
      };
    }

    // Add missing keys as not configured
    ALL_SECRET_KEYS.forEach(key => {
      if (key === 'STRIPE_MODE') return; // Skip mode, handled separately
      if (!secretsStatus[key]) {
        secretsStatus[key] = {
          exists: false,
          updatedAt: null,
          isTestKey: null,
        };
      }
    });

    return new Response(JSON.stringify({ secrets: secretsStatus, stripeMode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
