import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log(`Fetching models for provider: ${provider}`);
    
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
      // For Claude, we'll return the fixed list of available models
      // since there's no direct models endpoint
      models = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-2.1'
      ];
      
      // Verify the API key with a simple request
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
          throw new Error('Invalid Claude API key');
        }
      } catch (error) {
        console.error('Error verifying Claude API key:', error);
        throw new Error('Failed to verify Claude API key');
      }
    }

    console.log(`Successfully fetched ${models.length} models for ${provider}`);
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