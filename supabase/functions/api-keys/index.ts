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

    // Parse body
    let body: Record<string, unknown> = {};
    try {
      const rawBody = await req.text();
      console.log('Raw body:', rawBody ? rawBody.substring(0, 200) : 'empty');
      
      if (rawBody && rawBody.trim()) {
        body = JSON.parse(rawBody);
      }
    } catch (e) {
      console.log('Body parsing error:', e);
    }

    const action = (body.action as string) || 'list';
    console.log('Action:', action);

    // LIST - Get all API keys
    if (action === 'list') {
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

    // GET_KEY - Get full decrypted key for editing
    if (action === 'get_key') {
      const { id } = body as { id?: string };

      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, provider, encrypted_key')
        .eq('id', id)
        .single();

      if (error) throw error;

      let decryptedKey = '';
      try {
        if (data.encrypted_key) {
          decryptedKey = decrypt(data.encrypted_key, encryptionSecret);
        }
      } catch (e) {
        console.log('Error decrypting key:', e);
      }

      return new Response(JSON.stringify({ 
        data: { 
          id: data.id, 
          name: data.name, 
          provider: data.provider,
          key: decryptedKey 
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TEST_KEY - Test if a YouTube API key is valid and has quota
    if (action === 'test_key') {
      const { key } = body as { key?: string };

      if (!key) {
        return new Response(JSON.stringify({ error: 'Missing key' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${key}`;
        const response = await fetch(testUrl, { signal: AbortSignal.timeout(10000) });
        
        if (response.ok) {
          return new Response(JSON.stringify({ 
            valid: true, 
            message: 'Chave válida e com quota disponível' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorData = await response.json();
          const errorReason = errorData?.error?.errors?.[0]?.reason || 'unknown';
          const errorMessage = errorData?.error?.message || 'Erro desconhecido';
          
          let message = 'Chave inválida';
          if (errorReason === 'quotaExceeded' || errorReason === 'dailyLimitExceeded') {
            message = 'Quota diária excedida';
          } else if (errorReason === 'keyInvalid') {
            message = 'Chave inválida ou expirada';
          } else if (errorReason === 'accessNotConfigured') {
            message = 'API do YouTube não habilitada para esta chave';
          } else {
            message = errorMessage;
          }
          
          return new Response(JSON.stringify({ 
            valid: false, 
            message,
            reason: errorReason
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro de conexão';
        return new Response(JSON.stringify({ 
          valid: false, 
          message: `Erro ao testar: ${msg}` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // CREATE - Create new API key
    if (action === 'create') {
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

    // UPDATE - Update API key
    if (action === 'update') {
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
      if (newKey !== undefined && newKey.trim()) {
        updateData.encrypted_key = encrypt(newKey, encryptionSecret);
      }

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

    // DELETE - Delete API key
    if (action === 'delete') {
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

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
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
