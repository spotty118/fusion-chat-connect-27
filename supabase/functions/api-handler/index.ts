import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleProviderRequest = async (provider: string, message: string, model: string, apiKey: string) => {
  console.log(`Making request to ${provider} with model ${model}`);
  
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
        max_tokens: 1000,
      });
      break;

    case 'claude':
      endpoint = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000,
      });
      break;

    case 'google':
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: message
          }]
        }],
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain"
        }
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
    console.log(`Sending request to ${endpoint}`);
    console.log('Request body:', body);
    
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`${provider} API error:`, error);
      throw new Error(`${provider} API error: ${error}`);
    }

    const data = await response.json();
    console.log(`${provider} API response:`, data);

    // Transform response based on the provider
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
            content: {
              parts: [{
                text: data.candidates[0].text
              }]
            }
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
    
    if (!provider || !message || !model) {
      throw new Error('Missing required parameters');
    }

    const data = await handleProviderRequest(provider, message, model, apiKey);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in api-handler function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});