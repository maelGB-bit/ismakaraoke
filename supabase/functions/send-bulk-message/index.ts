const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MessageRequest {
  to: string;
  subject: string;
  body: string;
  type: 'email' | 'whatsapp';
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, type }: MessageRequest = await req.json();

    console.log(`Sending ${type} message to: ${to}`);

    // Validate required fields
    if (!to || !body) {
      throw new Error("Missing required fields: to, body");
    }

    if (type === 'email') {
      if (!subject) {
        throw new Error("Missing required field: subject (for email)");
      }

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY not configured");
      }

      // Convert plain text body to HTML
      const htmlBody = body
        .split('\n')
        .map((line: string) => line.trim() === '' ? '<br>' : `<p>${line}</p>`)
        .join('');

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mamute Karaoke <noreply@mamutekaraoke.com>",
          to: [to],
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                  p { margin: 0 0 10px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="header"><h2>🎤 Mamute Karaoke</h2></div>
                <div class="content">${htmlBody}</div>
                <div class="footer">
                  <p>Este email foi enviado automaticamente pelo Mamute Karaoke.</p>
                </div>
              </body>
            </html>
          `,
        }),
      });

      const responseData = await emailResponse.json();
      console.log("Email sent:", responseData);

      if (!emailResponse.ok) {
        throw new Error(responseData.message || "Failed to send email");
      }

      return new Response(
        JSON.stringify({ success: true, data: responseData }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For WhatsApp, handled client-side
    return new Response(
      JSON.stringify({ success: true, message: "WhatsApp handled client-side" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-bulk-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
