import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of public Invidious instances to try (fallback chain)
const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://invidious.privacyredirect.com',
  'https://iv.nbohr.dk',
];

async function searchWithInvidious(query: string): Promise<any[]> {
  const searchQuery = encodeURIComponent(query + ' karaoke');
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying Invidious instance: ${instance}`);
      
      const response = await fetch(
        `${instance}/api/v1/search?q=${searchQuery}&type=video`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000) // 8 second timeout per instance
        }
      );
      
      if (!response.ok) {
        console.log(`Instance ${instance} returned status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Success with ${instance}, found ${data.length} results`);
        
        return data.slice(0, 10).map((item: any) => ({
          id: item.videoId,
          title: item.title,
          thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
          channelTitle: item.author || 'Unknown',
          url: `https://www.youtube.com/watch?v=${item.videoId}`,
        }));
      }
    } catch (error) {
      console.log(`Instance ${instance} failed:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  throw new Error('All Invidious instances failed');
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const videos = await searchWithInvidious(query);

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in youtube-search function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Não foi possível buscar vídeos. Tente novamente em alguns segundos.',
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
