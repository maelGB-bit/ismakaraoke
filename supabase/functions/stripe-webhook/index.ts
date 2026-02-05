import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Generate a unique instance code
function generateInstanceCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
    logStep("Webhook received");

    // Fetch Stripe mode first
    const { data: modeData } = await supabase
      .from('secure_secrets')
      .select('encrypted_value')
      .eq('key_name', 'STRIPE_MODE')
      .single();

    const stripeMode = modeData?.encrypted_value === 'live' ? 'live' : 'test';
    logStep("Stripe mode", { stripeMode });

    // Fetch secrets based on mode
    const secretKeyName = stripeMode === 'live' ? 'STRIPE_SECRET_KEY_LIVE' : 'STRIPE_SECRET_KEY_TEST';
    const webhookSecretName = stripeMode === 'live' ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET_TEST';

    const { data: secrets, error: secretsError } = await supabase
      .from('secure_secrets')
      .select('key_name, encrypted_value')
      .in('key_name', [secretKeyName, webhookSecretName]);

    if (secretsError || !secrets || secrets.length === 0) {
      logStep("Failed to fetch secrets", { error: secretsError?.message });
      throw new Error("Failed to fetch Stripe configuration");
    }

    const stripeSecretKey = secrets.find(s => s.key_name === secretKeyName)?.encrypted_value;
    const webhookSecret = secrets.find(s => s.key_name === webhookSecretName)?.encrypted_value;

    if (!stripeSecretKey) {
      throw new Error(`${secretKeyName} not configured`);
    }
    if (!webhookSecret) {
      throw new Error(`${webhookSecretName} not configured`);
    }

    logStep("Secrets loaded successfully", { secretKeyName, webhookSecretName });

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature using async method (required for Deno)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event received", { type: event.type });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        const metadata = session.metadata || {};
        const planId = metadata.plan_id;
        const planName = metadata.plan_name;
        const durationHours = parseInt(metadata.duration_hours || '24', 10);
        const customerName = metadata.customer_name;
        const customerPhone = metadata.customer_phone;
        const instanceName = metadata.instance_name || `Karaokê de ${customerName}`;
        const couponCode = metadata.coupon_code;

        const customerEmail = session.customer_email || session.customer_details?.email;

        if (!customerEmail) {
          throw new Error("Customer email not found in session");
        }

        logStep("Session metadata", { planName, durationHours, customerEmail, instanceName });

        // Create payment record
        const paymentRecord = {
          stripe_session_id: session.id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string | null,
          user_email: customerEmail,
          user_name: customerName,
          user_phone: customerPhone,
          plan_id: planId,
          plan_name: planName,
          amount_paid: session.amount_total || 0,
          currency: session.currency || 'brl',
          coupon_code: couponCode || null,
          discount_amount: session.total_details?.amount_discount || 0,
          status: 'completed',
          payment_type: session.mode === 'subscription' ? 'subscription' : 'one_time',
        };

        // Check if user already exists in auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

        let userId: string;
        let tempPassword: string | null = null;

        if (existingUser) {
          userId = existingUser.id;
          logStep("Found existing user", { userId });
        } else {
          // Use the standard temporary password for consistency with the system
          tempPassword = 'mamutekaraoke';
          
          const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              name: customerName,
              phone: customerPhone,
            },
          });

          if (createUserError || !newUser.user) {
            throw new Error(`Failed to create user: ${createUserError?.message}`);
          }

          userId = newUser.user.id;
          logStep("Created new user with standard temp password", { userId, email: customerEmail });
        }

        // ALWAYS ensure coordinator role exists (for both new and existing users)
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'coordinator')
          .single();

        if (!existingRole) {
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: userId,
            role: 'coordinator',
          });

          if (roleError) {
            logStep("Warning: Failed to add coordinator role", { error: roleError.message });
          } else {
            logStep("Added coordinator role to user", { userId });
          }
        } else {
          logStep("User already has coordinator role", { userId });
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);

        // Generate unique instance code
        let instanceCode = generateInstanceCode();
        let codeExists = true;
        while (codeExists) {
          const { data: existing } = await supabase
            .from('karaoke_instances')
            .select('id')
            .eq('instance_code', instanceCode)
            .single();
          
          if (!existing) {
            codeExists = false;
          } else {
            instanceCode = generateInstanceCode();
          }
        }

        // Create or update karaoke instance
        const { data: existingInstance } = await supabase
          .from('karaoke_instances')
          .select('id, expires_at')
          .eq('coordinator_id', userId)
          .single();

        let instanceId: string;
        let finalExpiresAt = expiresAt;

        if (existingInstance) {
          // Check if user still has remaining time
          const currentExpiration = existingInstance.expires_at ? new Date(existingInstance.expires_at) : null;
          const now = new Date();
          
          if (currentExpiration && currentExpiration > now) {
            // User still has time remaining - ADD purchased hours to current expiration
            finalExpiresAt = new Date(currentExpiration);
            finalExpiresAt.setHours(finalExpiresAt.getHours() + durationHours);
            logStep("Adding time to existing balance", { 
              currentExpiration: currentExpiration.toISOString(), 
              hoursAdded: durationHours,
              newExpiration: finalExpiresAt.toISOString() 
            });
          } else {
            // User's time has expired - start fresh from now
            logStep("User's time expired, starting fresh from now", { 
              oldExpiration: currentExpiration?.toISOString(), 
              newExpiration: finalExpiresAt.toISOString() 
            });
          }

          // Update existing instance with calculated expiration
          const { error: updateError } = await supabase
            .from('karaoke_instances')
            .update({
              expires_at: finalExpiresAt.toISOString(),
              status: 'active',
              name: instanceName,
            })
            .eq('id', existingInstance.id);

          if (updateError) {
            throw new Error(`Failed to update instance: ${updateError.message}`);
          }

          instanceId = existingInstance.id;
          logStep("Updated existing instance", { instanceId, expiresAt: finalExpiresAt.toISOString() });
        } else {
          // Create new instance
          const { data: newInstance, error: instanceError } = await supabase
            .from('karaoke_instances')
            .insert({
              coordinator_id: userId,
              instance_code: instanceCode,
              name: instanceName,
              status: 'active',
              expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

          if (instanceError || !newInstance) {
            throw new Error(`Failed to create instance: ${instanceError?.message}`);
          }

          instanceId = newInstance.id;
          logStep("Created new instance", { instanceId, instanceCode, expiresAt: expiresAt.toISOString() });

          // Create event settings for the instance
          await supabase.from('event_settings').insert({
            karaoke_instance_id: instanceId,
            registration_open: true,
          });
        }

        // Save payment record with instance reference
        const { error: paymentError } = await supabase
          .from('payment_records')
          .insert({
            ...paymentRecord,
            instance_created: true,
            instance_id: instanceId,
          });

        if (paymentError) {
          logStep("Warning: Failed to save payment record", { error: paymentError.message });
        }

        // Update coupon usage if applicable
        if (couponCode) {
          await supabase.rpc('increment_coupon_usage', { coupon_code: couponCode.toUpperCase() });
        }

        // Create or update coordinator request record for tracking
        // First try to find by user_id, then by email
        const { data: existingByUserId } = await supabase
          .from('coordinator_requests')
          .select('id')
          .eq('user_id', userId)
          .single();

        const { data: existingByEmail } = await supabase
          .from('coordinator_requests')
          .select('id')
          .eq('email', customerEmail)
          .single();

        const existingRequest = existingByUserId || existingByEmail;

        if (existingRequest) {
          await supabase
            .from('coordinator_requests')
            .update({
              status: 'approved',
              user_id: userId,
              name: customerName || undefined, // Update name if provided
              expires_at: expiresAt.toISOString(),
              approved_at: new Date().toISOString(),
              instance_name: instanceName,
              current_password: tempPassword,
              must_change_password: !!tempPassword,
            })
            .eq('id', existingRequest.id);
          
          logStep("Updated existing coordinator request", { requestId: existingRequest.id });
        } else {
          // ALWAYS create a coordinator_request for new coordinators
          const { error: insertError } = await supabase
            .from('coordinator_requests')
            .insert({
              name: customerName || 'Coordenador',
              email: customerEmail,
              phone: customerPhone || '',
              interest: 'single_event',
              status: 'approved',
              user_id: userId,
              expires_at: expiresAt.toISOString(),
              approved_at: new Date().toISOString(),
              instance_name: instanceName,
              current_password: tempPassword,
              must_change_password: !!tempPassword,
            });
          
          if (insertError) {
            logStep("Warning: Failed to create coordinator request", { error: insertError.message });
          } else {
            logStep("Created new coordinator request for user", { userId, email: customerEmail });
          }
        }

        // Send confirmation email (for both new and existing users)
        try {
          const emailPayload = {
            email: customerEmail,
            name: customerName || 'Coordenador',
            tempPassword: tempPassword, // Will be null for existing users
            instanceName: instanceName,
            instanceCode: instanceCode,
            expiresAt: expiresAt.toISOString(),
            planName: planName || 'Plano Pago',
            isExistingUser: !tempPassword, // Flag to customize email content
          };

          const emailResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-credentials-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify(emailPayload),
            }
          );

          if (emailResponse.ok) {
            logStep("Confirmation email sent successfully", { isExistingUser: !tempPassword });
          } else {
            const errorData = await emailResponse.text();
            logStep("Warning: Failed to send confirmation email", { error: errorData });
          }
        } catch (emailError) {
          logStep("Warning: Error sending confirmation email", { error: String(emailError) });
        }

        logStep("Payment processed successfully", { userId, instanceId });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription event", { subscriptionId: subscription.id, status: subscription.status });

        // Handle subscription cancellation
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          const { data: paymentRecord } = await supabase
            .from('payment_records')
            .select('instance_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (paymentRecord?.instance_id) {
            await supabase
              .from('karaoke_instances')
              .update({ status: 'expired' })
              .eq('id', paymentRecord.instance_id);
            
            logStep("Instance marked as expired due to subscription cancellation");
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
