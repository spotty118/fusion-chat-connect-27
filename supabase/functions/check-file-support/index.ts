import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, model } = await req.json();

    // Check file support based on provider and model
    let supportsFiles = false;

    switch (provider) {
      case 'openai':
        // Only GPT-4 Vision models support files
        supportsFiles = model.includes('vision');
        break;
      case 'claude':
        // Claude 3 models support files
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});