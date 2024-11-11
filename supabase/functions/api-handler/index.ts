import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
    const { provider, message, model } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user ID from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Get API key from database
    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (apiKeyError || !apiKeyData) {
      throw new Error(`No API key found for provider ${provider}`);
    }

    // Make request to AI provider
    let response;
    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeyData.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: message }],
          }),
        });
        break;
      
      case 'claude':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKeyData.api_key,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: message }],
          }),
        });
        break;

      case 'google':
        response = await fetch('https://generativelanguage.googleapis.com/v1/models/' + model + ':generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKeyData.api_key,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        });
        break;

      case 'openrouter':
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeyData.api_key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': Deno.env.get('APP_URL') ?? '*',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: message }],
          }),
        });
        break;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const aiResponse = await response.json();
    
    // Store the chat message
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        user_id: user.id,
        provider,
        model,
        message,
        response: JSON.stringify(aiResponse),
      });

    return new Response(JSON.stringify(aiResponse), {
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