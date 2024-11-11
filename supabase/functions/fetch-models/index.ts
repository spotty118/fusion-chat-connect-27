import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from 'npm:@anthropic-ai/sdk';

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
      
      try {
        const anthropic = new Anthropic({
          apiKey: apiKey,
        });

        // Test the API key with a simple request
        const msg = await anthropic.messages.create({
          model: "claude-3.5-sonnet-20240321",
          max_tokens: 1000,
          temperature: 0,
          messages: [{ role: 'user', content: 'Hi' }]
        });

        console.log('Claude API test response:', msg);

        // Return the Claude 3.5 models
        models = [
          'claude-3.5-opus-20240321',    // Most capable model
          'claude-3.5-sonnet-20240321',  // Balanced model
          'claude-3.5-haiku-20240321',   // Fastest model
          'claude-2.1'                   // Legacy model
        ];

        console.log('Available Claude models:', models);
      } catch (error) {
        console.error('Error testing Claude API key:', error);
        throw new Error(`Failed to verify Claude API key: ${error.message}`);
      }
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