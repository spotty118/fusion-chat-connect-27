const API_BASE_URL = 'https://api.gptengineer.app';

export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/models/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        provider,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Provider ${provider} not supported by backend, using default models`);
        return getDefaultModels(provider);
      }
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data.models) ? data.models : getDefaultModels(provider);
  } catch (error) {
    console.error(`Error fetching models for ${provider}:`, error);
    return getDefaultModels(provider);
  }
};

const getDefaultModels = (provider: string): string[] => {
  const DEFAULT_MODELS = {
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    claude: ['claude-2', 'claude-instant'],
    google: ['palm-2'],
    openrouter: ['openrouter/auto', 'mistralai/mixtral-8x7b-instruct', 'anthropic/claude-2']
  };
  
  return DEFAULT_MODELS[provider] || [];
};