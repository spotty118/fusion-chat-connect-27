import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleProviderRequest = async (provider: string, message: string, model: string, apiKey: string) => {
  let response;
  let endpoint;
  let headers;
  let body;

  switch (provider) {
    case 'openai':
      endpoint = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
      });
      break;

    case 'claude':
      endpoint = 'https://api.anthropic.com/v1/messages';
      headers = {
        'anthropic-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      break;

    case 'google':
      endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = JSON.stringify({
        contents: [{
          parts: [{ text: message }]
        }]
      });
      break;

    case 'openrouter':
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_URL') ?? '*',
      };
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
      });
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  try {
    console.log(`Making request to ${provider} API...`);
    const result = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.error(`${provider} API error:`, errorText);
      throw new Error(`${provider} API returned status ${result.status}: ${errorText}`);
    }

    const data = await result.json();
    console.log(`${provider} API response:`, data);

    // Transform response based on provider
    switch (provider) {
      case 'openai':
      case 'openrouter':
        return {
          choices: [{
            message: {
              content: data.choices[0].message.content
            }
          }]
        };
      case 'claude':
        return {
          content: [{
            text: data.content[0].text
          }]
        };
      case 'google':
        return {
          candidates: [{
            output: data.candidates[0].content.parts[0].text
          }]
        };
      default:
        return data;
    }
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, message, model, apiKey } = await req.json();
    
    if (!provider || !message || !model || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request for ${provider} with model ${model}`);

    const response = await handleProviderRequest(provider, message, model, apiKey);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});