export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    if (!apiKey) {
      return getDefaultModels(provider);
    }

    // For Claude, we'll return the default models if the API key format is valid
    if (provider === 'claude') {
      return [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-2.1'
      ];
    }

    // For OpenRouter, we can use their models endpoint directly
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
    claude: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-2.1'],
    google: ['palm-2'],
    openrouter: ['openrouter/auto', 'mistralai/mixtral-8x7b-instruct', 'anthropic/claude-2']
  };
  
  return DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS] || [];
};