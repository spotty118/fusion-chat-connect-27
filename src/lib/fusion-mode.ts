import { supabase } from "@/integrations/supabase/client";

export const generateFusionResponse = async (message: string) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Please sign in to use Fusion Mode');
  }

  // Fetch API keys from Supabase with explicit typing
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

  // Initialize apiKeys object with all providers set to empty strings
  const apiKeys: Record<string, string> = {
    openai: '',
    claude: '',
    google: '',
    openrouter: ''
  };

  // Update apiKeys with the values from the database
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

  // Filter active providers (those with both API key and model selected)
  const activeProviders = Object.keys(apiKeys).filter(provider => {
    const hasApiKey = apiKeys[provider] && apiKeys[provider].length > 0;
    const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
    return hasApiKey && hasModel;
  });

  console.log('Active providers:', activeProviders);
  console.log('API Keys:', apiKeysData);
  console.log('Selected Models:', selectedModels);

  if (activeProviders.length < 3) {
    throw new Error(
      `Fusion mode requires at least 3 active providers. Currently active: ${activeProviders.length}. ` +
      `Active providers: ${activeProviders.join(', ')}. ` +
      'Please ensure you have both API keys and models selected for at least 3 providers.'
    );
  }

  try {
    // Make parallel requests to all active providers through our Edge Function
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