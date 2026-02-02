import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoInfo {
  duration_seconds: number;
  title: string;
}

// Decrypt function matching the encryption used in api-keys
function decrypt(encrypted: string, secret: string): string {
  const keyBytes = new TextEncoder().encode(secret);
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const result = new Uint8Array(encryptedBytes.length);
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(result);
}

// Parse ISO 8601 duration format (PT1H2M3S)
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

async function getYouTubeVideoInfo(videoId: string, apiKey: string): Promise<VideoInfo | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('YouTube API error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('Video not found');
      return null;
    }
    
    const item = data.items[0];
    const duration = item.contentDetails?.duration;
    const title = item.snippet?.title;
    
    return {
      duration_seconds: parseISO8601Duration(duration || ''),
      title: title || '',
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Video ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Supabase client to fetch API keys from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active API keys from database
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('provider', 'youtube')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (apiKeysError) {
      console.error('Error fetching API keys:', apiKeysError);
    }

    // Decryption secret (same as used in api-keys function)
    const encryptionSecret = supabaseKey.slice(0, 32);

    // Try database API keys first
    if (apiKeys && apiKeys.length > 0) {
      for (const keyRecord of apiKeys) {
        try {
          const decryptedKey = decrypt(keyRecord.encrypted_key, encryptionSecret);
          console.log('Trying decrypted API key...');
          const result = await getYouTubeVideoInfo(videoId, decryptedKey);
          if (result) {
            return new Response(
              JSON.stringify(result),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (e) {
          console.error('Error decrypting or using key:', e);
        }
      }
    }

    // Fallback to environment variable
    const envApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (envApiKey) {
      const result = await getYouTubeVideoInfo(videoId, envApiKey);
      if (result) {
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // No valid API key or video not found
    return new Response(
      JSON.stringify({ error: "Could not fetch video info. No valid API key or video not found." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
