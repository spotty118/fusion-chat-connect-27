export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    if (!apiKey) {
      return getDefaultModels(provider);
    }

    // For OpenAI, fetch models from their API
    if (provider === 'openai' && apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return getDefaultModels(provider);
        }

        const data = await response.json();
        // Filter for chat models and sort by newest first
        const chatModels = data.data
          .filter((model: { id: string }) => 
            model.id.includes('gpt') && 
            (model.id.includes('4') || model.id.includes('3.5'))
          )
          .map((model: { id: string }) => model.id)
          .sort()
          .reverse();

        return chatModels.length > 0 ? chatModels : getDefaultModels(provider);
      } catch (error) {
        console.warn('Error fetching OpenAI models:', error);
        return getDefaultModels(provider);
      }
    }

    // For Claude, fetch available models from their API
    if (provider === 'claude' && apiKey.startsWith('sk-ant-')) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return getDefaultModels(provider);
        }

        const data = await response.json();
        // Sort models by newest first
        const models = data.models
          .map((model: { name: string }) => model.name)
          .sort()
          .reverse();

        return models.length > 0 ? models : getDefaultModels(provider);
      } catch (error) {
        console.warn('Error fetching Claude models:', error);
        return getDefaultModels(provider);
      }
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