import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

    // Get user ID from JWT
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = await userResponse.json();
    const userId = userData.id;

    // Get API key from database
    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
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
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: message }],
          }),
        });
        break;
      
      // Add more providers as needed
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const aiResponse = await response.json();
    
    // Store the chat message
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        user_id: userId,
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