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

Deno.serve(async (req) => {
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

    const { email, name, tempPassword, instanceName, instanceCode, expiresAt, planName, isExistingUser }: CredentialsEmailRequest = await req.json();

    if (!email) {
      throw new Error("Missing required field: email");
    }

    logStep("Sending email", { email, instanceName, isExistingUser, hasTempPassword: !!tempPassword });

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
          🔐 Suas Credenciais de Acesso
        </h3>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">E-mail de Login</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0; font-family: monospace; background: #1a1a1a; padding: 10px; border-radius: 6px;">
            ${email}
          </p>
        </div>
        
        <div style="margin-bottom: 0;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Senha Provisória</p>
          <p style="color: #22c55e; font-size: 22px; margin: 0; font-family: monospace; font-weight: bold; background: #1a1a1a; padding: 12px; border-radius: 6px; letter-spacing: 2px; text-align: center;">
            ${tempPassword}
          </p>
        </div>
      </div>
      
      <!-- How to Access Instructions -->
      <div style="background-color: #1a2e1a; border: 1px solid #22c55e; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <h3 style="color: #22c55e; margin: 0 0 15px 0; font-size: 16px;">
          📋 Como Acessar Seu Karaokê
        </h3>
        
        <ol style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li style="margin-bottom: 10px;">Clique no botão <strong style="color: #f97316;">"Acessar Meu Karaokê"</strong> abaixo</li>
          <li style="margin-bottom: 10px;">Na página de login, insira seu <strong style="color: #ffffff;">e-mail</strong> e a <strong style="color: #22c55e;">senha provisória</strong> acima</li>
          <li style="margin-bottom: 10px;">Após o primeiro login, você será solicitado a <strong style="color: #ffffff;">criar uma nova senha segura</strong></li>
          <li style="margin-bottom: 0;">Pronto! Você terá acesso completo ao painel do coordenador</li>
        </ol>
      </div>
      
      <!-- Password Warning -->
      <div style="background-color: #422006; border: 1px solid #f97316; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #fed7aa; font-size: 14px; margin: 0;">
          ⚠️ <strong>Importante:</strong> Por segurança, você será obrigado a alterar sua senha provisória no primeiro acesso. Escolha uma senha forte e memorável!
        </p>
      </div>
    ` : `
      <!-- Existing user message -->
      <div style="background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <h3 style="color: #22c55e; margin: 0 0 15px 0; font-size: 16px;">
          ✅ Acesso com Credenciais Existentes
        </h3>
        <p style="color: #ffffff; font-size: 16px; margin: 0 0 15px 0;">
          Como você já possui uma conta, utilize suas credenciais atuais para acessar o sistema.
        </p>
        <p style="color: #888888; font-size: 14px; margin: 0;">
          Seu e-mail de acesso: <strong style="color: #ffffff;">${email}</strong>
        </p>
      </div>
      
      <div style="background-color: #1e3a5f; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #bfdbfe; font-size: 14px; margin: 0;">
          💡 <strong>Esqueceu sua senha?</strong> Use a opção "Esqueci minha senha" na página de login para redefinir.
        </p>
      </div>
    `;

    const emailHtml = `
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
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              ${isExistingUser ? '🔄 Plano Renovado!' : '🎉 Pagamento Confirmado!'}
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0;">
              Olá <strong>${name || 'Coordenador'}</strong>! 👋
            </p>
            
            <p style="color: #cccccc; font-size: 16px; margin: 0 0 25px 0;">
              ${isExistingUser 
                ? `Seu plano <strong style="color: #f97316;">${planName}</strong> foi renovado com sucesso! Seu tempo foi adicionado à sua conta.`
                : `Seu plano <strong style="color: #f97316;">${planName}</strong> foi ativado com sucesso! Veja abaixo como acessar seu karaokê:`
              }
            </p>
            
            ${credentialsSection}
            
            <!-- Instance Info -->
            <div style="background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 12px; padding: 25px; margin: 20px 0;">
              <h3 style="color: #f97316; margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                🎵 Dados do Seu Karaokê
              </h3>
              
              <div style="margin-bottom: 15px;">
                <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Nome da Instância</p>
                <p style="color: #ffffff; font-size: 16px; margin: 0;">${instanceName}</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Código de Acesso dos Participantes</p>
                <p style="color: #f97316; font-size: 28px; margin: 0; font-family: monospace; font-weight: bold; letter-spacing: 4px; text-align: center; background: #1a1a1a; padding: 15px; border-radius: 8px;">
                  ${instanceCode}
                </p>
                <p style="color: #888888; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
                  Compartilhe este código com os participantes para votarem e se inscreverem
                </p>
              </div>
              
              <div>
                <p style="color: #888888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Válido até</p>
                <p style="color: #ffffff; font-size: 16px; margin: 0;">${formattedExpires}</p>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mamutekaraoke.com/app/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 18px 50px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                Acessar Meu Karaokê →
              </a>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #1e1e1e; border-radius: 12px; padding: 25px; margin: 20px 0;">
              <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">
                📚 Próximos Passos
              </h3>
              <p style="color: #cccccc; font-size: 14px; margin: 0; line-height: 1.7;">
                Em breve você receberá um <strong style="color: #f97316;">segundo e-mail</strong> com o manual completo do Mamute Karaokê, incluindo instruções detalhadas sobre o <strong>Modo Host</strong>, <strong>Modo TV</strong> e como imprimir os <strong>QR Codes</strong> para as mesas do seu evento.
              </p>
            </div>
            
            <p style="color: #888888; font-size: 14px; margin: 25px 0 0 0; text-align: center;">
              Qualquer dúvida, entre em contato pelo WhatsApp no site!
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
    `;

    // Send credentials email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mamute Karaokê <noreply@mamutekaraoke.com>",
        to: [email],
        subject: isExistingUser 
          ? "🎤 Seu plano foi renovado - Mamute Karaokê"
          : "🎤 Bem-vindo! Suas credenciais de acesso - Mamute Karaokê",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      logStep("Failed to send credentials email", { error: emailResult });
      throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
    }

    logStep("Credentials email sent successfully", { response: JSON.stringify(emailResult) });

    // Now send the manual email
    const manualEmailResponse = await sendManualEmail(resendApiKey, email, name, instanceName, instanceCode);
    logStep("Manual email result", { success: manualEmailResponse });

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

async function sendManualEmail(resendApiKey: string, email: string, name: string, instanceName: string, instanceCode: string): Promise<boolean> {
  const qrCodeUrl = `https://mamutekaraoke.com/app/inscricao?code=${instanceCode}`;
  
  // Generate QR code as base64 using a public API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}&format=png`;
  
  // Fetch the QR code image and convert to base64
  let qrCodeBase64 = '';
  try {
    const qrResponse = await fetch(qrCodeImageUrl);
    const qrBuffer = await qrResponse.arrayBuffer();
    qrCodeBase64 = btoa(String.fromCharCode(...new Uint8Array(qrBuffer)));
  } catch (e) {
    console.log("Failed to generate QR code base64", e);
  }

  const manualHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📖 Manual do Mamute Karaokê</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Guia completo para seu evento de karaokê
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0;">
            Olá <strong>${name || 'Coordenador'}</strong>! 👋
          </p>
          
          <p style="color: #cccccc; font-size: 16px; margin: 0 0 25px 0;">
            Este é o manual completo do <strong style="color: #f97316;">${instanceName}</strong>. Aqui você encontrará todas as informações para gerenciar seu evento de karaokê com sucesso!
          </p>
          
          <!-- MODO HOST -->
          <div style="background-color: #2a2a2a; border: 2px solid #f97316; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <h2 style="color: #f97316; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
              🎙️ MODO HOST (Coordenador)
            </h2>
            
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 20px 0;">
              O Modo Host é a central de controle do seu karaokê. Use-o no seu celular ou tablet para gerenciar todo o evento.
            </p>
            
            <h4 style="color: #ffffff; margin: 20px 0 10px 0; font-size: 14px;">⚙️ Funções Principais:</h4>
            <ul style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong style="color: #22c55e;">Fila de Espera:</strong> Visualize todos os cantores inscritos em ordem de chegada</li>
              <li><strong style="color: #22c55e;">Chamar Cantor:</strong> Selecione o próximo cantor e inicie sua apresentação</li>
              <li><strong style="color: #22c55e;">Buscar Música:</strong> Pesquise vídeos do YouTube para os cantores</li>
              <li><strong style="color: #22c55e;">Controle do Vídeo:</strong> Play, pause e próximo vídeo</li>
              <li><strong style="color: #22c55e;">Votação:</strong> Abrir/fechar votação para cada apresentação</li>
              <li><strong style="color: #22c55e;">Ranking:</strong> Acompanhe a classificação em tempo real</li>
              <li><strong style="color: #22c55e;">Inscrições:</strong> Abrir/fechar período de inscrições</li>
              <li><strong style="color: #22c55e;">Vídeos Instrucionais:</strong> Reproduzir vídeos explicativos entre as apresentações</li>
              <li><strong style="color: #22c55e;">QR Code:</strong> Gerar e imprimir QR codes para as mesas</li>
            </ul>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 15px; margin-top: 15px;">
              <p style="color: #f97316; font-size: 13px; margin: 0;">
                💡 <strong>Dica:</strong> Mantenha o Modo Host aberto durante todo o evento para ter controle total das apresentações.
              </p>
            </div>
          </div>
          
          <!-- MODO TV -->
          <div style="background-color: #2a2a2a; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <h2 style="color: #3b82f6; margin: 0 0 20px 0; font-size: 20px;">
              📺 MODO TV (Telão)
            </h2>
            
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 20px 0;">
              O Modo TV é projetado para ser exibido na televisão ou projetor do estabelecimento. Ele mostra o conteúdo para todos os participantes.
            </p>
            
            <h4 style="color: #ffffff; margin: 20px 0 10px 0; font-size: 14px;">📺 O que aparece na TV:</h4>
            <ul style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong style="color: #22c55e;">Vídeo do Karaokê:</strong> Reproduz automaticamente o vídeo selecionado pelo Host</li>
              <li><strong style="color: #22c55e;">Nome do Cantor:</strong> Exibe quem está cantando no momento</li>
              <li><strong style="color: #22c55e;">Próximos da Fila:</strong> Mostra os próximos cantores</li>
              <li><strong style="color: #22c55e;">Código do Evento:</strong> Exibe o código para novos participantes entrarem</li>
              <li><strong style="color: #22c55e;">Ranking ao Vivo:</strong> Classificação atualizada automaticamente</li>
              <li><strong style="color: #22c55e;">QR Code:</strong> Código escaneável para acesso rápido</li>
            </ul>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 15px; margin-top: 15px;">
              <p style="color: #3b82f6; font-size: 13px; margin: 0;">
                💡 <strong>Dica:</strong> Conecte um notebook/computador na TV via HDMI e abra o Modo TV em tela cheia (F11).
              </p>
            </div>
          </div>
          
          <!-- MODO VOTAÇÃO -->
          <div style="background-color: #2a2a2a; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <h2 style="color: #22c55e; margin: 0 0 20px 0; font-size: 20px;">
              ⭐ VOTAÇÃO DOS PARTICIPANTES
            </h2>
            
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 15px 0;">
              Os participantes usam seus celulares para votar nas apresentações e se inscrever para cantar.
            </p>
            
            <h4 style="color: #ffffff; margin: 15px 0 10px 0; font-size: 14px;">📱 Como funciona para os participantes:</h4>
            <ol style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Escanear o QR Code na mesa ou digitar o código</li>
              <li>Preencher nome, e-mail e telefone (uma única vez)</li>
              <li>Votar de 0 a 10 em cada apresentação</li>
              <li>Se inscrever para cantar quando desejar</li>
            </ol>
          </div>
          
          <!-- QR CODE SECTION -->
          <div style="background-color: #2a2a2a; border: 2px solid #f97316; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <h2 style="color: #f97316; margin: 0 0 20px 0; font-size: 20px;">
              📱 SEU QR CODE
            </h2>
            
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 20px 0;">
              Este é o QR Code do seu evento. Imprima e distribua nas mesas para que os participantes possam votar e se inscrever facilmente!
            </p>
            
            <div style="text-align: center; background-color: #ffffff; padding: 30px; border-radius: 12px; margin: 20px 0;">
              <img src="${qrCodeImageUrl}" alt="QR Code do Evento" width="250" height="250" style="display: block; margin: 0 auto;" />
              <p style="color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 15px 0 5px 0; font-family: monospace; letter-spacing: 4px;">
                ${instanceCode}
              </p>
              <p style="color: #666666; font-size: 14px; margin: 0;">
                ${instanceName}
              </p>
            </div>
            
            <h4 style="color: #ffffff; margin: 20px 0 10px 0; font-size: 14px;">🖨️ Como Imprimir:</h4>
            <ol style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Acesse o <strong style="color: #f97316;">Modo Host</strong> no seu karaokê</li>
              <li>Clique no menu <strong style="color: #f97316;">"Guia do Evento"</strong></li>
              <li>Use o botão <strong style="color: #f97316;">"Imprimir QR Code"</strong></li>
              <li>Escolha imprimir múltiplas cópias (uma para cada mesa)</li>
              <li>Recorte e distribua nas mesas do estabelecimento</li>
            </ol>
            
            <div style="background-color: #422006; border-radius: 8px; padding: 15px; margin-top: 15px;">
              <p style="color: #fed7aa; font-size: 13px; margin: 0;">
                ⚠️ <strong>Recomendação:</strong> Plastifique os QR Codes para maior durabilidade. Use papel de boa qualidade para impressão.
              </p>
            </div>
          </div>
          
          <!-- DICAS FINAIS -->
          <div style="background-color: #1e1e1e; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">
              🌟 Dicas para um Evento de Sucesso
            </h3>
            <ul style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Teste o sistema antes do evento começar</li>
              <li>Garanta boa conexão de internet no local</li>
              <li>Incentive todos a votarem para maior engajamento</li>
              <li>Use os vídeos instrucionais para explicar o sistema</li>
              <li>Anuncie o ranking periodicamente para criar expectativa</li>
            </ul>
          </div>
          
          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://mamutekaraoke.com/app/login" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 18px 50px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
              Acessar Meu Karaokê →
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; margin: 25px 0 0 0; text-align: center;">
            Qualquer dúvida, entre em contato pelo WhatsApp no site!
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
  `;

  try {
    const emailPayload: Record<string, unknown> = {
      from: "Mamute Karaokê <noreply@mamutekaraoke.com>",
      to: [email],
      subject: "📖 Manual Completo - Como usar o Mamute Karaokê",
      html: manualHtml,
    };

    // Add QR code as attachment if we got it
    if (qrCodeBase64) {
      emailPayload.attachments = [
        {
          filename: `qrcode-${instanceCode}.png`,
          content: qrCodeBase64,
        }
      ];
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log("Failed to send manual email", result);
      return false;
    }

    console.log("Manual email sent successfully", result);
    return true;
  } catch (e) {
    console.log("Error sending manual email", e);
    return false;
  }
}
