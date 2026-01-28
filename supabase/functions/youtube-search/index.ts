import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Piped API instances as fallback
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.r4fo.com',
  'https://api.piped.privacydev.net',
];

// Invidious instances as secondary fallback
const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch',
  'https://yt.artemislena.eu',
];

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

// Simple decryption using XOR with a key derived from the secret
function decrypt(encrypted: string, secret: string): string {
  const keyBytes = new TextEncoder().encode(secret);
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const result = new Uint8Array(encryptedBytes.length);
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(result);
}

// Get YouTube API keys from database
async function getYouTubeKeysFromDB(): Promise<string[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionSecret = supabaseServiceKey.slice(0, 32);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('provider', 'youtube')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.log('Error fetching API keys from DB:', error.message);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No YouTube API keys found in database');
      return [];
    }
    
    const keys: string[] = [];
    for (const row of data) {
      try {
        const decrypted = decrypt(row.encrypted_key, encryptionSecret);
        if (decrypted) keys.push(decrypted);
      } catch (e) {
        console.log('Error decrypting key:', e);
      }
    }
    
    return keys;
  } catch (error) {
    console.log('Error in getYouTubeKeysFromDB:', error);
    return [];
  }
}

// Get YouTube API keys from environment (fallback)
function getYouTubeKeysFromEnv(): string[] {
  const apiKeysRaw = Deno.env.get('YOUTUBE_API_KEY');
  if (!apiKeysRaw) return [];
  return apiKeysRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

// Try YouTube Data API with multiple keys
async function searchWithYouTubeAPI(query: string, apiKeys: string[]): Promise<VideoResult[]> {
  if (apiKeys.length === 0) {
    console.log('No YouTube API keys available');
    return [];
  }

  console.log(`Found ${apiKeys.length} YouTube API key(s)`);
  const searchQuery = query + ' karaoke';

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    console.log(`Trying YouTube API key ${i + 1}/${apiKeys.length}`);

    try {
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: '10',
        key: apiKey,
        videoEmbeddable: 'true',
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`YouTube API key ${i + 1} failed with status ${response.status}: ${errorText.substring(0, 200)}`);
        
        // If quota exceeded or forbidden, try next key
        if (response.status === 403 || response.status === 429) {
          continue;
        }
        continue;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        console.log(`Success with YouTube API key ${i + 1}, found ${data.items.length} results`);
        
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`YouTube API key ${i + 1} error: ${msg}`);
      continue;
    }
  }

  console.log('All YouTube API keys exhausted or failed');
  return [];
}

// Try Piped API instances
async function searchWithPiped(query: string): Promise<VideoResult[]> {
  const searchQuery = encodeURIComponent(query + ' karaoke');
  
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`Trying Piped instance: ${instance}`);
      
      const response = await fetch(
        `${instance}/search?q=${searchQuery}&filter=videos`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000)
        }
      );
      
      if (!response.ok) {
        console.log(`Piped ${instance} returned status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        console.log(`Success with Piped ${instance}, found ${data.items.length} results`);
        
        return data.items.slice(0, 10).map((item: any) => {
          const videoId = item.url?.replace('/watch?v=', '') || '';
          return {
            id: videoId,
            title: item.title || 'Unknown',
            thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            channelTitle: item.uploaderName || 'Unknown',
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Piped ${instance} failed: ${msg}`);
      continue;
    }
  }
  
  return [];
}

// Try Invidious API instances
async function searchWithInvidious(query: string): Promise<VideoResult[]> {
  const searchQuery = encodeURIComponent(query + ' karaoke');
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying Invidious instance: ${instance}`);
      
      const response = await fetch(
        `${instance}/api/v1/search?q=${searchQuery}&type=video`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000)
        }
      );
      
      if (!response.ok) {
        console.log(`Invidious ${instance} returned status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Success with Invidious ${instance}, found ${data.length} results`);
        
        return data.slice(0, 10).map((item: any) => ({
          id: item.videoId,
          title: item.title,
          thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
          channelTitle: item.author || 'Unknown',
          url: `https://www.youtube.com/watch?v=${item.videoId}`,
        }));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Invidious ${instance} failed: ${msg}`);
      continue;
    }
  }
  
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      console.error('Invalid query parameter:', query);
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query);

    // 1. Get API keys: first from database, then from environment as fallback
    let apiKeys = await getYouTubeKeysFromDB();
    if (apiKeys.length === 0) {
      console.log('No keys in database, checking environment...');
      apiKeys = getYouTubeKeysFromEnv();
    }

    // 2. Try YouTube API with available keys
    let videos = await searchWithYouTubeAPI(query, apiKeys);
    
    // 3. Fallback to Piped if YouTube API fails
    if (videos.length === 0) {
      console.log('YouTube API failed, trying Piped...');
      videos = await searchWithPiped(query);
    }
    
    // 4. Fallback to Invidious if Piped fails
    if (videos.length === 0) {
      console.log('Piped failed, trying Invidious...');
      videos = await searchWithInvidious(query);
    }

    if (videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          videos: [],
          error: 'Nenhum vídeo encontrado. Cole o link do YouTube diretamente.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in youtube-search function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        videos: [],
        error: 'Não foi possível buscar vídeos. Cole o link do YouTube diretamente.',
        details: errorMessage 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
