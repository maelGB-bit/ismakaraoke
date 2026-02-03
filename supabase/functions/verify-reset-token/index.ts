import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-RESET-TOKEN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { token, newPassword } = await req.json();

    if (!token) {
      throw new Error("Token is required");
    }

    if (!newPassword) {
      throw new Error("New password is required");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    logStep("Looking up token");

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      logStep("Token not found or already used", { error: tokenError?.message });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "invalid_token",
        message: "Token inválido ou já utilizado" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      logStep("Token expired", { expires_at: tokenData.expires_at });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "token_expired",
        message: "Token expirado. Solicite um novo link de redefinição." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Token valid, finding user", { email: tokenData.email });

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      logStep("Error listing users", { error: userError.message });
      throw new Error("Error finding user");
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === tokenData.email.toLowerCase());

    if (!user) {
      logStep("User not found", { email: tokenData.email });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "user_not_found",
        message: "Usuário não encontrado" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Updating user password", { userId: user.id });

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      logStep("Error updating password", { error: updateError.message });
      throw new Error("Error updating password");
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Also update coordinator_requests if applicable
    await supabase
      .from('coordinator_requests')
      .update({ 
        must_change_password: false,
        current_password: newPassword 
      })
      .eq('email', tokenData.email.toLowerCase());

    logStep("Password updated successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
