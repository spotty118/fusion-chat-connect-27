import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleProviderRequest = async (
  provider: string,
  message: string,
  model: string,
  apiKey: string
) => {
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
      throw new Error('Missing authorization header');
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user ID from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Invalid authentication token');
    }

    // Get API key from database
    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (apiKeyError || !apiKeyData?.api_key) {
      console.error('API key error:', apiKeyError);
      throw new Error(`No API key found for provider ${provider}`);
    }

    try {
      const aiResponse = await handleProviderRequest(provider, message, model, apiKeyData.api_key);

      // Store the chat message
      const { error: insertError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          user_id: user.id,
          provider,
          model,
          message,
          response: JSON.stringify(aiResponse),
        });

      if (insertError) {
        console.error('Error storing chat message:', insertError);
      }

      return new Response(JSON.stringify(aiResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error(`Provider error (${provider}):`, error);
      throw new Error(`Provider ${provider} error: ${error.message}`);
    }

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});