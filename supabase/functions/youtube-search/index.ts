import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface YouTubeApiResult {
  videos: VideoResult[];
  quotaExceeded: boolean;
}

const QUOTA_ERROR_REASONS = new Set([
  'quotaExceeded',
  'dailyLimitExceeded',
  'rateLimitExceeded',
  'userRateLimitExceeded',
]);

function isQuotaError(errorText: string): boolean {
  try {
    const parsed = JSON.parse(errorText);
    const reason = parsed?.error?.errors?.[0]?.reason;
    if (typeof reason === 'string' && QUOTA_ERROR_REASONS.has(reason)) {
      return true;
    }
  } catch {
    // Ignore JSON parse errors and fall through to substring checks.
  }

  const lowered = errorText.toLowerCase();
  return lowered.includes('quota') || lowered.includes('rate limit');
}

// Try YouTube Data API with multiple keys
async function searchWithYouTubeAPI(query: string): Promise<YouTubeApiResult> {
  const apiKeysRaw = Deno.env.get('YOUTUBE_API_KEY');
  if (!apiKeysRaw) {
    console.log('No YOUTUBE_API_KEY configured');
    return { videos: [], quotaExceeded: false };
  }

  // Support multiple keys separated by comma
  const apiKeys = apiKeysRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
  console.log(`Found ${apiKeys.length} YouTube API key(s)`);

  const searchQuery = query + ' karaoke';
  let quotaExceeded = false;

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
          if (isQuotaError(errorText)) {
            quotaExceeded = true;
          }
          continue;
        }
        continue;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        console.log(`Success with YouTube API key ${i + 1}, found ${data.items.length} results`);
        
        return {
          videos: data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          })),
          quotaExceeded: false,
        };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`YouTube API key ${i + 1} error: ${msg}`);
      continue;
    }
  }

  console.log('All YouTube API keys exhausted or failed');
  return { videos: [], quotaExceeded };
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

    // 1. Try YouTube API with multiple keys
    const youtubeResult = await searchWithYouTubeAPI(query);
    let videos = youtubeResult.videos;
    
    // 2. Fallback to Piped if YouTube API fails
    if (videos.length === 0) {
      console.log('YouTube API failed, trying Piped...');
      videos = await searchWithPiped(query);
    }
    
    // 3. Fallback to Invidious if Piped fails
    if (videos.length === 0) {
      console.log('Piped failed, trying Invidious...');
      videos = await searchWithInvidious(query);
    }

    if (videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          videos: [],
          errorCode: youtubeResult.quotaExceeded ? 'quotaExceeded' : 'noVideos',
          error: youtubeResult.quotaExceeded
            ? 'Quota da API do YouTube esgotada.'
            : 'Nenhum vídeo encontrado.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ videos, errorCode: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in youtube-search function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        videos: [],
        errorCode: 'searchFailed',
        error: 'Não foi possível buscar vídeos.',
        details: errorMessage 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
