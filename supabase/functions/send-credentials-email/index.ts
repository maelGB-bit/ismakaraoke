import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CREDENTIALS-EMAIL] ${step}${detailsStr}`);
};

interface CredentialsEmailRequest {
  email: string;
  name: string;
  tempPassword: string | null;
  instanceName: string;
  instanceCode: string;
  expiresAt: string;
  planName: string;
  isExistingUser?: boolean;
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

    // Fetch RESEND_API_KEY from secure_secrets table
    const { data: secretData, error: secretError } = await supabase
      .from('secure_secrets')
      .select('encrypted_value')
      .eq('key_name', 'RESEND_API_KEY')
      .single();

    if (secretError || !secretData) {
      logStep("Failed to fetch RESEND_API_KEY from secure_secrets", { error: secretError?.message });
      throw new Error("RESEND_API_KEY not configured in secure_secrets");
    }

    const resendApiKey = secretData.encrypted_value;
    logStep("RESEND_API_KEY loaded from secure_secrets");

    const resend = new Resend(resendApiKey);

    const { email, name, tempPassword, instanceName, instanceCode, expiresAt, planName, isExistingUser }: CredentialsEmailRequest = await req.json();

    if (!email) {
      throw new Error("Missing required field: email");
    }

    logStep("Sending email", { email, instanceName, isExistingUser });

    const expiresDate = new Date(expiresAt);
    const formattedExpires = expiresDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Build credentials section - only show for new users with temp password
    const credentialsSection = tempPassword ? `
      <!-- Credentials Box -->
      <div style="background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <h3 style="color: #f97316; margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
          📧 Credenciais de Acesso
        </h3>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">E-mail</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0; font-family: monospace; background: #1a1a1a; padding: 10px; border-radius: 6px;">
            ${email}
          </p>
        </div>
        
        <div style="margin-bottom: 0;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Senha Temporária</p>
          <p style="color: #22c55e; font-size: 20px; margin: 0; font-family: monospace; font-weight: bold; background: #1a1a1a; padding: 10px; border-radius: 6px; letter-spacing: 2px;">
            ${tempPassword}
          </p>
        </div>
      </div>
    ` : `
      <!-- Existing user message -->
      <div style="background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <p style="color: #ffffff; font-size: 16px; margin: 0;">
          ✅ Use suas credenciais existentes para acessar o sistema.
        </p>
      </div>
    `;

    const passwordWarning = tempPassword ? `
      <!-- Warning -->
      <div style="background-color: #422006; border: 1px solid #f97316; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #fed7aa; font-size: 14px; margin: 0;">
          ⚠️ <strong>Importante:</strong> Recomendamos que você altere sua senha temporária após o primeiro acesso para maior segurança.
        </p>
      </div>
    ` : '';

    const emailResponse = await resend.emails.send({
      from: "Mamute Karaokê <noreply@resend.dev>",
      to: [email],
      subject: isExistingUser 
        ? "🎤 Seu plano foi renovado - Mamute Karaokê"
        : "🎤 Suas credenciais de acesso - Mamute Karaokê",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316, #8b4513); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎤 Mamute Karaokê</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Pagamento Confirmado!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0;">
                Olá <strong>${name || 'Coordenador'}</strong>! 👋
              </p>
              
              <p style="color: #cccccc; font-size: 16px; margin: 0 0 25px 0;">
                ${isExistingUser 
                  ? `Seu plano <strong style="color: #f97316;">${planName}</strong> foi renovado com sucesso!`
                  : `Seu plano <strong style="color: #f97316;">${planName}</strong> foi ativado com sucesso! Abaixo estão suas credenciais de acesso:`
                }
              </p>
              
              ${credentialsSection}
              
              <!-- Instance Info -->
              <div style="background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 12px; padding: 25px; margin: 20px 0;">
                <h3 style="color: #f97316; margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                  🎵 Seu Karaokê
                </h3>
                
                <div style="margin-bottom: 15px;">
                  <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Nome da Instância</p>
                  <p style="color: #ffffff; font-size: 16px; margin: 0;">${instanceName}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Código de Acesso</p>
                  <p style="color: #f97316; font-size: 24px; margin: 0; font-family: monospace; font-weight: bold; letter-spacing: 3px;">
                    ${instanceCode}
                  </p>
                </div>
                
                <div>
                  <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Válido até</p>
                  <p style="color: #ffffff; font-size: 16px; margin: 0;">${formattedExpires}</p>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://ismakaraoke.lovable.app/app/login" 
                   style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Acessar Meu Karaokê →
                </a>
              </div>
              
              ${passwordWarning}
              
              <p style="color: #888888; font-size: 14px; margin: 25px 0 0 0; text-align: center;">
                Qualquer dúvida, entre em contato conosco!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #0a0a0a; padding: 20px; text-align: center;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
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
