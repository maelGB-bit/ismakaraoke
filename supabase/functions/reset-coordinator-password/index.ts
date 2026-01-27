import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  userId: string;
  requestId: string;
}

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-12) + 'A1!';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Check if caller is admin
    const { data: isAdminData, error: adminCheckError } = await userClient.rpc("is_admin");
    if (adminCheckError || !isAdminData) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ResetPasswordRequest = await req.json();
    const { userId, requestId } = body;

    if (!userId || !requestId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate new password
    const tempPassword = generateTempPassword();
    
    // Update user password
    const { error: updatePasswordError } = await adminClient.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    if (updatePasswordError) {
      console.error("Password update error:", updatePasswordError);
      return new Response(JSON.stringify({ error: "Failed to reset password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update temp_password in coordinator_requests
    const { error: updateRequestError } = await adminClient
      .from("coordinator_requests")
      .update({ temp_password: tempPassword })
      .eq("id", requestId);

    if (updateRequestError) {
      console.error("Update request error:", updateRequestError);
    }

    console.log("Password reset successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        tempPassword,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
