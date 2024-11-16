import { supabase } from "@/integrations/supabase/client";

export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    if (!apiKey) {
      return [];
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
          return [];
        }

        return data.models || [];
      } catch (error) {
        console.warn(`Error fetching ${provider} models:`, error);
        return [];
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
          return [];
        }

        const data = await response.json();
        return data.data.map((model: { id: string }) => model.id);
      } catch (error) {
        console.warn('Error fetching OpenRouter models:', error);
        return [];
      }
    }

    // For Google, just return default models since we don't need to fetch them
    if (provider === 'google' && apiKey) {
      return ['palm-2'];
    }

    return [];
  } catch (error) {
    console.error(`Error fetching models for ${provider}:`, error);
    return [];
  }
};