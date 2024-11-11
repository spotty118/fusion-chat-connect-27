import { makeProviderRequest } from './provider-api';

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
    // Make parallel requests to all active providers
    const responses = await Promise.all(
      activeProviders.map(provider =>
        makeProviderRequest(
          provider,
          apiKeys[provider]!,
          selectedModels[provider]!,
          message
        ).catch(error => {
          console.error(`Error with ${provider}:`, error);
          return `[${provider} error: ${error.message}]`;
        })
      )
    );

    // Combine responses with provider names
    return activeProviders
      .map((provider, index) => `${provider.toUpperCase()}: ${responses[index]}`)
      .join('\n\n');
  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};