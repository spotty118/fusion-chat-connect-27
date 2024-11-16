import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchOpenAIModels } from "./providers/openai.ts";
import { fetchClaudeModels } from "./providers/claude.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiKey } = await req.json();
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ models: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let models: string[] = [];

    switch (provider) {
      case 'openai':
        models = await fetchOpenAIModels(apiKey);
        break;
      case 'claude':
        models = await fetchClaudeModels(apiKey);
        break;
      default:
        models = [];
    }

    return new Response(
      JSON.stringify({ models }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-models function:', error);
    return new Response(
      JSON.stringify({ error: error.message, models: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});