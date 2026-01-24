import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Piped API instances (more reliable than Invidious)
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.r4fo.com',
  'https://api.piped.privacydev.net',
  'https://pipedapi.darkness.services',
  'https://pipedapi.in.projectsegfau.lt',
];

// Invidious instances as fallback
const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch',
  'https://yt.artemislena.eu',
  'https://invidious.protokolla.fi',
];

async function searchWithPiped(query: string): Promise<any[]> {
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

async function searchWithInvidious(query: string): Promise<any[]> {
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

    // Try Piped first (more reliable)
    let videos = await searchWithPiped(query);
    
    // Fallback to Invidious if Piped fails
    if (videos.length === 0) {
      console.log('Piped failed, trying Invidious...');
      videos = await searchWithInvidious(query);
    }

    if (videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          videos: [],
          error: 'Nenhum vídeo encontrado. Tente uma busca diferente ou cole o link do YouTube diretamente.'
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
