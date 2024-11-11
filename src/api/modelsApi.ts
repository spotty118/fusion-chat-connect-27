import { supabase } from "@/integrations/supabase/client";

export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    if (!apiKey) {
      return getDefaultModels(provider);
    }

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    // For OpenAI and Claude, fetch models through our Edge Function
    if ((provider === 'openai' && apiKey) || (provider === 'claude' && apiKey)) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-models', {
          body: { provider, apiKey },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (error) {
          console.warn(`Error fetching ${provider} models:`, error);
          return getDefaultModels(provider);
        }

        return data.models.length > 0 ? data.models : getDefaultModels(provider);
      } catch (error) {
        console.warn(`Error fetching ${provider} models:`, error);
        return getDefaultModels(provider);
      }
    }

    // For OpenRouter, we can use their models endpoint directly as they support CORS
    if (provider === 'openrouter' && apiKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return getDefaultModels(provider);
        }

        const data = await response.json();
        return data.data.map((model: { id: string }) => model.id);
      } catch (error) {
        console.warn('Error fetching OpenRouter models:', error);
        return getDefaultModels(provider);
      }
    }

    return getDefaultModels(provider);
  } catch (error) {
    console.error(`Error fetching models for ${provider}:`, error);
    return getDefaultModels(provider);
  }
};

const getDefaultModels = (provider: string): string[] => {
  const DEFAULT_MODELS = {
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    claude: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1'
    ],
    google: ['palm-2'],
    openrouter: ['openrouter/auto', 'mistralai/mixtral-8x7b-instruct', 'anthropic/claude-2']
  };
  
  return DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS] || [];
};