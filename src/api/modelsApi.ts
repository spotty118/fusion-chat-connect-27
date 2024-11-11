import Anthropic from "@anthropic-ai/sdk";

export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    if (provider === 'claude' && apiKey) {
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Enable browser usage
      });
      
      // Return curated list of Claude models with correct names
      return ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1'];
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

    // For other providers, return default models
    return getDefaultModels(provider);
  } catch (error) {
    console.error(`Error fetching models for ${provider}:`, error);
    return getDefaultModels(provider);
  }
};

const getDefaultModels = (provider: string): string[] => {
  const DEFAULT_MODELS = {
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1'],
    google: ['palm-2'],
    openrouter: ['openrouter/auto', 'mistralai/mixtral-8x7b-instruct', 'anthropic/claude-2']
  };
  
  return DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS] || [];
};
