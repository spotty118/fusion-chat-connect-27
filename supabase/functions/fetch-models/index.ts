import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { provider, apiKey } = await req.json();
    let models: string[] = [];

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('OpenAI API error:', await response.text());
        throw new Error('Failed to fetch OpenAI models');
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
    }

    if (provider === 'claude') {
      console.log('Fetching Claude models with API key:', apiKey ? 'Present' : 'Missing');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1,
          messages: [
            { role: "user", content: "Hi" }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', errorText);
        throw new Error(`Failed to fetch Claude models: ${errorText}`);
      }

      // Since we can't fetch models directly, we'll return the known Claude-3 models
      models = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-2.1'
      ];

      console.log('Available Claude models:', models);
    }

    return new Response(
      JSON.stringify({ models }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
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
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
