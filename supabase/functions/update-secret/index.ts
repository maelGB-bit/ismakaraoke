import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SECRET] ${step}${detailsStr}`);
};

// Allowed secret keys that can be updated via this endpoint
const ALLOWED_SECRETS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

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

    // Use anon key to get user from token
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Use service role to check admin status (bypasses RLS)
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

    logStep("Admin verified", { userId: userData.user.id });

    const { key, value } = await req.json();

    if (!key || !value) {
      throw new Error("Missing key or value");
    }

    if (!ALLOWED_SECRETS.includes(key)) {
      throw new Error(`Secret '${key}' is not allowed to be updated via this endpoint`);
    }

    logStep("Updating secret", { key, valueLength: value.length });

    // Store the secret in Supabase Vault
    // Note: In a production environment, you would use Supabase Vault or a similar secure storage
    // For now, we'll update the secret in the edge function environment
    // This requires the Supabase CLI or dashboard to set secrets
    
    // Since we can't directly set Edge Function secrets from code,
    // we'll store the encrypted value in the database and use it from there
    
    // Reuse the supabaseAdmin client created above for admin check

    // Store in a secure_secrets table (we'll create this if it doesn't exist)
    const { error: upsertError } = await supabaseAdmin
      .from('secure_secrets')
      .upsert(
        {
          key_name: key,
          encrypted_value: value, // In production, encrypt this
          updated_at: new Date().toISOString(),
          updated_by: userData.user.id,
        },
        { onConflict: 'key_name' }
      );

    if (upsertError) {
      logStep("Error storing secret", { error: upsertError.message });
      throw new Error(`Failed to store secret: ${upsertError.message}`);
    }

    logStep("Secret updated successfully", { key });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${key} atualizada com sucesso. Nota: Para que a alteração tenha efeito completo, pode ser necessário atualizar os secrets via Lovable Cloud.` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
