import { supabase } from "@/integrations/supabase/client";

export const generateFusionResponse = async (message: string) => {
  const apiKeys = {
    openai: localStorage.getItem('openai_key'),
    claude: localStorage.getItem('claude_key'),
    google: localStorage.getItem('google_key'),
    openrouter: localStorage.getItem('openrouter_key')
  };

  const selectedModels = {
    openai: localStorage.getItem('openai_model'),
    claude: localStorage.getItem('claude_model'),
    google: localStorage.getItem('google_model'),
    openrouter: localStorage.getItem('openrouter_model')
  };

  // Filter active providers (those with both API key and model selected)
  const activeProviders = Object.keys(apiKeys).filter(
    provider => apiKeys[provider] && selectedModels[provider]
  );

  if (activeProviders.length < 3) {
    throw new Error('Fusion mode requires at least 3 active providers');
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    // Make parallel requests to all active providers through our Edge Function
    const responses = await Promise.all(
      activeProviders.map(async provider => {
        try {
          const { data, error } = await supabase.functions.invoke('api-handler', {
            body: {
              provider,
              message,
              model: selectedModels[provider]
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          if (error) throw error;

          // Extract response based on provider
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
              response = data.candidates[0].output;
              break;
            default:
              throw new Error(`Unsupported provider: ${provider}`);
          }
          return response;
        } catch (error) {
          console.error(`Error with ${provider}:`, error);
          return `[${provider} error: ${error.message}]`;
        }
      })
    );

    // Combine responses with provider names
    return activeProviders
      .map((provider, index) => `${provider.toUpperCase()}: ${responses[index]}`)
      .join('\n\n');
  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};