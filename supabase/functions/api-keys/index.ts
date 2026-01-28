import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple encryption using XOR with a key derived from the secret
function encrypt(text: string, secret: string): string {
  const keyBytes = new TextEncoder().encode(secret);
  const textBytes = new TextEncoder().encode(text);
  const result = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...result));
}

function decrypt(encrypted: string, secret: string): string {
  const keyBytes = new TextEncoder().encode(secret);
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const result = new Uint8Array(encryptedBytes.length);
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(result);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.slice(0, 32);
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = req.method;

    // GET /api-keys - List all API keys
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, provider, is_active, created_at, updated_at, encrypted_key')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mask the keys - only show last 4 chars
      const maskedData = data?.map(key => {
        let keyPreview = '****';
        try {
          if (key.encrypted_key) {
            const decrypted = decrypt(key.encrypted_key, encryptionSecret);
            keyPreview = `****${decrypted.slice(-4)}`;
          }
        } catch (e) {
          console.log('Error decrypting key for preview:', e);
        }
        return {
          ...key,
          key_preview: keyPreview,
          encrypted_key: undefined,
        };
      });

      return new Response(JSON.stringify({ data: maskedData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse body for POST, PATCH, DELETE
    let body: Record<string, unknown> = {};
    if (method !== 'GET') {
      try {
        const text = await req.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (e) {
        console.log('No JSON body provided or invalid JSON');
      }
    }

    // POST /api-keys - Create new API key
    if (method === 'POST') {
      const { name, provider, key } = body as { name?: string; provider?: string; key?: string };

      if (!name || !provider || !key) {
        return new Response(JSON.stringify({ error: 'Missing required fields: name, provider, key' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const encryptedKey = encrypt(key, encryptionSecret);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({ name, provider, encrypted_key: encryptedKey, is_active: true })
        .select('id, name, provider, is_active, created_at')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data: { ...data, key_preview: `****${key.slice(-4)}` } }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH /api-keys/:id - Update API key
    if (method === 'PATCH') {
      const { id, name, provider, is_active, key: newKey } = body as { 
        id?: string; name?: string; provider?: string; is_active?: boolean; key?: string;
      };

      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (provider !== undefined) updateData.provider = provider;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (newKey !== undefined) updateData.encrypted_key = encrypt(newKey, encryptionSecret);

      const { data, error } = await supabase
        .from('api_keys')
        .update(updateData)
        .eq('id', id)
        .select('id, name, provider, is_active, updated_at')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api-keys/:id - Delete API key
    if (method === 'DELETE') {
      const { id } = body as { id?: string };

      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('API Keys function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
