import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, model } = await req.json();
    console.log('Checking file support for:', { provider, model }); // Debug log

    // Check file support based on provider and model
    let supportsFiles = false;

    switch (provider) {
      case 'openai':
        supportsFiles = model.includes('vision');
        break;
      case 'claude':
        supportsFiles = model.includes('claude-3');
        break;
      default:
        supportsFiles = false;
    }

    return new Response(
      JSON.stringify({ supportsFiles }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in check-file-support:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});