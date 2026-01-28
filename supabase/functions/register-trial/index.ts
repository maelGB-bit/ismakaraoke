import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

interface RegisterTrialRequest {
  name: string;
  email: string;
  phone: string;
}

function generateInstanceCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TEMP_PASSWORD = "mamutekaraoke";
const TRIAL_DURATION_HOURS = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP from headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    console.log("Client IP:", clientIp);

    const body: RegisterTrialRequest = await req.json();
    const { name, email, phone } = body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already has a request
    const { data: existingEmail } = await adminClient
      .from("coordinator_requests")
      .select("id, status, ip_address")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingEmail) {
      return new Response(JSON.stringify({ 
        error: "Este email já possui uma solicitação",
        code: "EMAIL_EXISTS"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if IP already used a trial with different email (only for approved trials)
    const { data: existingIpTrials } = await adminClient
      .from("coordinator_requests")
      .select("id, email, status")
      .eq("ip_address", clientIp)
      .in("status", ["approved", "expired"])
      .neq("email", normalizedEmail);

    if (existingIpTrials && existingIpTrials.length > 0) {
      // This IP already used a trial - mark as duplicate and don't approve
      const { error: insertError } = await adminClient
        .from("coordinator_requests")
        .insert({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          interest: "single_event",
          status: "duplicado",
          ip_address: clientIp,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to create request");
      }

      return new Response(JSON.stringify({ 
        error: "Você já realizou um teste gratuito com outro email. Para continuar usando o sistema, escolha um dos nossos planos.",
        code: "DUPLICATE_IP",
        existingEmail: existingIpTrials[0].email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the request and auto-approve
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TRIAL_DURATION_HOURS);

    // Create new user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: TEMP_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes("already been registered")) {
        // Get existing user
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === normalizedEmail);
        
        if (existingUser) {
          // Reset password
          await adminClient.auth.admin.updateUserById(existingUser.id, {
            password: TEMP_PASSWORD,
            app_metadata: { session_invalidated: false }
          });

          // Check if they already have a coordinator role and instance
          const { data: existingRole } = await adminClient
            .from("user_roles")
            .select("id")
            .eq("user_id", existingUser.id)
            .eq("role", "coordinator")
            .maybeSingle();

          if (!existingRole) {
            await adminClient
              .from("user_roles")
              .insert({ user_id: existingUser.id, role: "coordinator" });
          }

          const { data: existingInstance } = await adminClient
            .from("karaoke_instances")
            .select("id, instance_code")
            .eq("coordinator_id", existingUser.id)
            .maybeSingle();

          if (existingInstance) {
            // Update existing instance
            await adminClient
              .from("karaoke_instances")
              .update({
                name: `Trial ${name.trim()}`,
                status: "active",
                expires_at: expiresAt.toISOString(),
              })
              .eq("id", existingInstance.id);

            // Create/update request record
            await adminClient
              .from("coordinator_requests")
              .insert({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                interest: "single_event",
                status: "approved",
                user_id: existingUser.id,
                approved_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                instance_name: `Trial ${name.trim()}`,
                temp_password: TEMP_PASSWORD,
                current_password: TEMP_PASSWORD,
                must_change_password: true,
                ip_address: clientIp,
              });

            return new Response(JSON.stringify({
              success: true,
              instanceCode: existingInstance.instance_code,
              tempPassword: TEMP_PASSWORD,
              expiresAt: expiresAt.toISOString(),
              trialHours: TRIAL_DURATION_HOURS,
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user!.id;

    // Add coordinator role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "coordinator" });

    if (roleError) {
      console.error("Role error:", roleError);
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create karaoke instance
    const instanceCode = generateInstanceCode();
    const { error: instanceError } = await adminClient
      .from("karaoke_instances")
      .insert({
        coordinator_id: userId,
        name: `Trial ${name.trim()}`,
        instance_code: instanceCode,
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

    if (instanceError) {
      console.error("Instance error:", instanceError);
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to create instance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create request record
    const { error: requestError } = await adminClient
      .from("coordinator_requests")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        interest: "single_event",
        status: "approved",
        user_id: userId,
        approved_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        instance_name: `Trial ${name.trim()}`,
        temp_password: TEMP_PASSWORD,
        current_password: TEMP_PASSWORD,
        must_change_password: true,
        ip_address: clientIp,
      });

    if (requestError) {
      console.error("Request error:", requestError);
      // Don't rollback - coordinator was created successfully
    }

    return new Response(JSON.stringify({
      success: true,
      instanceCode,
      tempPassword: TEMP_PASSWORD,
      expiresAt: expiresAt.toISOString(),
      trialHours: TRIAL_DURATION_HOURS,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
