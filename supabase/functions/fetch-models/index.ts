import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { provider, apiKey } = await req.json();
    console.log(`Fetching models for provider: ${provider}`);
    
    if (!apiKey) {
      console.log('No API key provided');
      return new Response(
        JSON.stringify({ 
          models: getDefaultModels(provider),
          message: 'Using default models (no API key provided)'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    let models: string[] = [];

    if (provider === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('OpenAI API error:', await response.text());
          return new Response(
            JSON.stringify({ 
              models: getDefaultModels(provider),
              error: 'Failed to fetch OpenAI models'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }

        const data = await response.json();
        models = data.data
          .filter((model: { id: string }) => 
            (model.id.includes('gpt-4') || model.id.includes('gpt-3.5')) &&
            !model.id.includes('vision') &&
            !model.id.includes('instruct')
          )
          .map((model: { id: string }) => model.id)
          .sort()
          .reverse();
      } catch (error) {
        console.error('Error fetching OpenAI models:', error);
        return new Response(
          JSON.stringify({ 
            models: getDefaultModels(provider),
            error: 'Error fetching OpenAI models'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    if (provider === 'claude') {
      models = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1'
      ];
      
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });

        if (!response.ok) {
          console.error('Claude API verification failed:', await response.text());
          return new Response(
            JSON.stringify({ 
              models: getDefaultModels(provider),
              error: 'Invalid Claude API key'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
      } catch (error) {
        console.error('Error verifying Claude API key:', error);
        return new Response(
          JSON.stringify({ 
            models: getDefaultModels(provider),
            error: 'Failed to verify Claude API key'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    if (provider === 'openrouter') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('OpenRouter API error:', await response.text());
          return new Response(
            JSON.stringify({ 
              models: getDefaultModels(provider),
              error: 'Failed to fetch OpenRouter models'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }

        const data = await response.json();
        models = data.data.map((model: { id: string }) => model.id);
      } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
        return new Response(
          JSON.stringify({ 
            models: getDefaultModels(provider),
            error: 'Error fetching OpenRouter models'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    console.log(`Successfully fetched ${models.length} models for ${provider}`);
    return new Response(
      JSON.stringify({ models }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in fetch-models function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getDefaultModels(provider: string): string[] {
  const DEFAULT_MODELS = {
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    claude: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1'
    ],
    google: ['palm-2'],
    openrouter: ['openrouter/auto', 'mistralai/mixtral-8x7b-instruct', 'anthropic/claude-2']
  };
  
  return DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS] || [];
}