import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, message, model, apiKey } = await req.json();
    console.log(`Processing request for provider: ${provider}, model: ${model}`);

    if (!apiKey) {
      throw new Error(`API key is required for ${provider}`);
    }

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
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        };
        body = JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: message
          }],
          max_tokens: 1000,
          system: "You are a helpful AI assistant."
        });
        break;

      case 'google':
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        headers = {
          'Content-Type': 'application/json',
        };
        body = JSON.stringify({
          contents: [{
            parts: [{
              text: message
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
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
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${provider} API error:`, errorText);
        throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`${provider} API response received:`, data);

      let content = '';
      switch (provider) {
        case 'openai':
        case 'openrouter':
          content = data.choices[0].message.content;
          break;
        case 'claude':
          content = data.content[0].text;
          break;
        case 'google':
          content = data.candidates[0].output;
          break;
      }

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});