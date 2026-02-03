import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailPayload = await req.json();
    console.log("Auth email payload received:", JSON.stringify(payload, null, 2));

    const { user, email_data } = payload;
    const { email_action_type, token_hash, redirect_to, site_url } = email_data;

    // Build the confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || site_url;
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    let subject = "";
    let htmlContent = "";

    switch (email_action_type) {
      case "recovery":
        subject = "🔑 Redefinição de senha - Mamute Karaokê";
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
              <div style="background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎤 Mamute Karaokê</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 24px;">Redefinição de Senha</h2>
                
                <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Olá! Recebemos uma solicitação para redefinir a senha da sua conta.
                </p>
                
                <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Clique no botão abaixo para criar uma nova senha:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
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
              
              <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Mamute Karaokê. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "signup":
      case "email_confirmation":
        subject = "✉️ Confirme seu e-mail - Mamute Karaokê";
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
              <div style="background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎤 Mamute Karaokê</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 24px;">Confirme seu e-mail</h2>
                
                <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Clique no botão abaixo para confirmar seu endereço de e-mail:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Confirmar e-mail
                  </a>
                </div>
              </div>
              
              <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Mamute Karaokê. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "magiclink":
        subject = "🔗 Seu link de acesso - Mamute Karaokê";
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
              <div style="background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎤 Mamute Karaokê</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 24px;">Link de Acesso</h2>
                
                <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Clique no botão abaixo para acessar sua conta:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(90deg, #e91e63 0%, #9c27b0 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Acessar minha conta
                  </a>
                </div>
              </div>
              
              <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Mamute Karaokê. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        subject = "Mamute Karaokê";
        htmlContent = `
          <p>Clique no link abaixo:</p>
          <a href="${confirmationUrl}">Continuar</a>
        `;
    }

    const emailResponse = await resend.emails.send({
      from: "Mamute Karaokê <noreply@mamutekaraoke.com>",
      to: [user.email],
      subject,
      html: htmlContent,
    });

    console.log("Auth email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending auth email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
