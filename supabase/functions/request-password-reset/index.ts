import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-PASSWORD-RESET] ${step}${detailsStr}`);
};

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

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

    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Checking if email exists in auth", { email });

    // Check if user exists in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      logStep("Error listing users", { error: userError.message });
      throw new Error("Error checking user");
    }

    const userExists = userData.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      // Don't reveal if email exists or not for security
      logStep("User not found, returning success anyway for security", { email });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("User found, generating reset token");

    // Generate token and expiration (1 hour)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalidate any existing tokens for this email
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email.toLowerCase());

    // Insert new token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt,
      });

    if (insertError) {
      logStep("Error inserting token", { error: insertError.message });
      throw new Error("Error creating reset token");
    }

    logStep("Token created, fetching Resend API key");

    // Fetch RESEND_API_KEY from secure_secrets table
    const { data: secretData, error: secretError } = await supabase
      .from('secure_secrets')
      .select('encrypted_value')
      .eq('key_name', 'RESEND_API_KEY')
      .single();

    if (secretError || !secretData) {
      logStep("Failed to fetch RESEND_API_KEY", { error: secretError?.message });
      throw new Error("Email service not configured");
    }

    const resend = new Resend(secretData.encrypted_value);

    // Build reset URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://ismakaraoke.lovable.app";
    const resetUrl = `${baseUrl}/app/reset-password?token=${token}`;

    logStep("Sending reset email", { email, resetUrl });

    const emailResponse = await resend.emails.send({
      from: "Mamute Karaokê <noreply@mamutekaraoke.com>",
      to: [email],
      subject: "🔑 Redefinição de senha - Mamute Karaokê",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎤 Mamute Karaokê</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 24px;">Redefinição de Senha</h2>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá! Recebemos uma solicitação para redefinir a senha da sua conta.
              </p>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Redefinir minha senha
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Se você não solicitou esta redefinição, pode ignorar este e-mail com segurança.
              </p>
              
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Este link expira em 1 hora.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #333;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Mamute Karaokê. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", { response: JSON.stringify(emailResponse) });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
