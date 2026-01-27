import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCoordinatorRequest {
  email: string;
  name: string;
  instanceName: string;
  durationHours: number;
  requestId: string;
}

function generateInstanceCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-12) + 'A1!';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify they're admin
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

    // Get the caller's user ID for approved_by field
    const { data: { user: callerUser } } = await userClient.auth.getUser();

    // Parse request body
    const body: CreateCoordinatorRequest = await req.json();
    const { email, name, instanceName, durationHours, requestId } = body;

    if (!email || !instanceName || !durationHours || !requestId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to create user without affecting admin session
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string;
    let tempPassword: string | null = null;
    let isNewUser = false;

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      userId = existingUser.id;
      
      // Generate new password and update it for existing user
      tempPassword = generateTempPassword();
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
      
      console.log("Password reset successfully for user:", userId);
      
      // Check if they already have a coordinator role
      const { data: existingRole } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "coordinator")
        .maybeSingle();
      
      if (!existingRole) {
        // Add coordinator role if missing
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role: "coordinator" });
        
        if (roleError) {
          console.error("Role error:", roleError);
        }
      }

      // Check if they already have an instance
      const { data: existingInstance } = await adminClient
        .from("karaoke_instances")
        .select("id, instance_code")
        .eq("coordinator_id", userId)
        .maybeSingle();

      if (existingInstance) {
        // Update the existing instance with new expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);
        
        await adminClient
          .from("karaoke_instances")
          .update({
            name: instanceName.trim(),
            status: "active",
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", existingInstance.id);

        // Update request status
        await adminClient
          .from("coordinator_requests")
          .update({
            status: "approved",
            user_id: userId,
            approved_at: new Date().toISOString(),
            approved_by: callerUser?.id || null,
            expires_at: expiresAt.toISOString(),
            instance_name: instanceName.trim(),
            temp_password: tempPassword,
          })
          .eq("id", requestId);

        return new Response(
          JSON.stringify({
            success: true,
            userId,
            instanceCode: existingInstance.instance_code,
            tempPassword,
            expiresAt: expiresAt.toISOString(),
            renewed: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Create new user
      isNewUser = true;
      tempPassword = generateTempPassword();
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        console.error("Auth error:", authError);
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!authData.user) {
        return new Response(JSON.stringify({ error: "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = authData.user.id;

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
    }

    // 3. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    // 4. Create karaoke instance
    const instanceCode = generateInstanceCode();
    const { error: instanceError } = await adminClient
      .from("karaoke_instances")
      .insert({
        coordinator_id: userId,
        name: instanceName.trim(),
        instance_code: instanceCode,
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

    if (instanceError) {
      console.error("Instance error:", instanceError);
      // Cleanup: delete role and user
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to create instance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Update request status
    const { error: updateError } = await adminClient
      .from("coordinator_requests")
      .update({
        status: "approved",
        user_id: userId,
        approved_at: new Date().toISOString(),
        approved_by: callerUser?.id || null,
        expires_at: expiresAt.toISOString(),
        instance_name: instanceName.trim(),
        temp_password: tempPassword,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Update request error:", updateError);
      // Don't rollback - the coordinator was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        instanceCode,
        tempPassword,
        expiresAt: expiresAt.toISOString(),
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
