import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
      });
      break;

    case 'google':
      endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      };
      body = JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
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

  return await result.json();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, message, model } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');

    // Verify user token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key for the provider
    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error(`API key error for ${provider}:`, apiKeyError);
      return new Response(
        JSON.stringify({ 
          error: `No API key found for ${provider}. Please add your API key in the settings.`,
          provider 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const aiResponse = await handleProviderRequest(provider, message, model, apiKeyData.api_key);

      // Store the chat message and response
      const { error: insertError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          user_id: user.id,
          provider,
          model,
          message,
          response: JSON.stringify(aiResponse)
        });

      if (insertError) {
        console.error('Error storing chat message:', insertError);
      }

      return new Response(
        JSON.stringify(aiResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error(`Provider error (${provider}):`, error);
      return new Response(
        JSON.stringify({ error: `Provider ${provider} error: ${error.message}`, provider }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
