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
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body));

    const provider = body?.provider?.toString();
    const model = body?.model?.toString();
    
    if (!provider || !model) {
      console.warn('Missing required fields:', { provider, model });
      return new Response(
        JSON.stringify({ 
          error: 'Provider and model are required',
          received: { provider, model }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check file support based on provider and model
    let supportsFiles = false;

    switch (provider.toLowerCase()) {
      case 'openai':
        // Support both vision models and GPT-4 models
        supportsFiles = model.toLowerCase().includes('vision') || 
                       model.toLowerCase().includes('gpt-4');
        break;
      case 'claude':
        // Claude 3 models support vision
        supportsFiles = model.toLowerCase().includes('claude-3');
        break;
      case 'google':
        // Gemini models support vision
        supportsFiles = model.toLowerCase().includes('gemini');
        break;
      case 'openrouter':
        // OpenRouter supports vision through specific models
        supportsFiles = model.toLowerCase().includes('vision') || 
                       model.toLowerCase().includes('claude-3') ||
                       model.toLowerCase().includes('gemini') ||
                       model.toLowerCase().includes('gpt-4');
        break;
      default:
        supportsFiles = false;
    }

    const response = { supportsFiles };
    console.log('Sending response:', JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-file-support:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});