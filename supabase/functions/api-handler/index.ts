import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "@/integrations/supabase/client";

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

    // Generate cache key based on provider, message, and model
    const cacheKey = `${provider}-${model}-${message}`;

    // Check cache first
    const { data: existingResponse } = await supabase
      .from('response_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .single();

    if (existingResponse) {
      console.log('Cache hit for provider response');
      return new Response(JSON.stringify(existingResponse.response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
          response = {
            choices: [{
              message: {
                content: data.choices[0].message.content
              }
            }]
          };
          break;
        case 'claude':
          response = {
            content: [{
              text: data.content[0].text
            }]
          };
          break;
        case 'google':
          response = {
            candidates: [{
              content: {
                parts: [{
                  text: data.candidates[0].content.parts[0].text
                }]
              }
            }]
          };
          break;
        default:
          response = data;
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      throw error;
    }

    // Cache the response
    await supabase.from('response_cache').insert({
      cache_key: cacheKey,
      response: response,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Cache for 24 hours
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
