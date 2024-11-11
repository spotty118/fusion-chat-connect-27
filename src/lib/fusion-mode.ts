import { supabase } from "@/integrations/supabase/client";

interface ResponseCache {
  id: string;
  cache_key: string;
  combined_response: string;
  created_at?: string;
  expires_at: string;
}

const combineResponsesWithAI = async (responses: { provider: string; response: string }[]): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    // Check cache first
    const cacheKey = JSON.stringify(responses.map(r => ({ provider: r.provider, response: r.response.substring(0, 100) })));
    
    const { data: existingResponse } = await supabase
      .from('response_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .returns<ResponseCache>()
      .single();

    if (existingResponse) {
      console.log('Cache hit! Returning cached response');
      return existingResponse.combined_response;
    }

    const { data, error } = await supabase.functions.invoke('combine-responses', {
      body: { responses },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) throw error;

    // Cache the combined response
    const { error: cacheError } = await supabase
      .from('response_cache')
      .insert({
        cache_key: cacheKey,
        combined_response: data.response,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Cache for 24 hours
      });

    if (cacheError) {
      console.error('Error caching response:', cacheError);
    }

    return data.response;
  } catch (error) {
    console.error('Error combining responses with AI:', error);
    return responses.map(r => r.response).join('\n\n');
  }
};

export const generateFusionResponse = async (message: string) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Please sign in to use Fusion Mode');
  }

  const { data: apiKeysData, error: apiKeysError } = await supabase
    .from('api_keys')
    .select('provider, api_key')
    .eq('user_id', session.user.id);

  if (apiKeysError) {
    console.error('Failed to fetch API keys:', apiKeysError);
    throw new Error('Failed to fetch API keys');
  }

  if (!apiKeysData || apiKeysData.length === 0) {
    throw new Error('No API keys found. Please add your API keys in the settings.');
  }

  const apiKeys: Record<string, string> = {
    openai: '',
    claude: '',
    google: '',
    openrouter: ''
  };

  apiKeysData.forEach(({ provider, api_key }) => {
    if (provider in apiKeys) {
      apiKeys[provider] = api_key;
    }
  });

  const selectedModels = {
    openai: localStorage.getItem('openai_model'),
    claude: localStorage.getItem('claude_model'),
    google: localStorage.getItem('google_model'),
    openrouter: localStorage.getItem('openrouter_model')
  };

  const activeProviders = Object.keys(apiKeys).filter(provider => {
    const hasApiKey = apiKeys[provider] && apiKeys[provider].length > 0;
    const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
    return hasApiKey && hasModel;
  });

  if (activeProviders.length < 3) {
    throw new Error(
      `Fusion mode requires at least 3 active providers. Currently active: ${activeProviders.length}. ` +
      `Active providers: ${activeProviders.join(', ')}. ` +
      'Please ensure you have both API keys and models selected for at least 3 providers.'
    );
  }

  try {
    const responses = await Promise.all(
      activeProviders.map(async provider => {
        try {
          const { data, error } = await supabase.functions.invoke('api-handler', {
            body: {
              provider,
              message,
              model: selectedModels[provider],
              apiKey: apiKeys[provider]
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          if (error) throw error;

          let response;
          switch (provider) {
            case 'openai':
            case 'openrouter':
              response = data.choices[0].message.content;
              break;
            case 'claude':
              response = data.content[0].text;
              break;
            case 'google':
              response = data.candidates[0].content.parts[0].text;
              break;
            default:
              throw new Error(`Unsupported provider: ${provider}`);
          }
          return { provider, response };
        } catch (error) {
          console.error(`Error with ${provider}:`, error);
          return { provider, response: `Error: ${error.message}` };
        }
      })
    );

    // Filter out error responses
    const validResponses = responses.filter(r => !r.response.startsWith('Error:'));
    if (validResponses.length === 0) {
      throw new Error('All providers failed to generate a response');
    }

    // Use OpenAI to combine and optimize the responses
    return await combineResponsesWithAI(validResponses);

  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};