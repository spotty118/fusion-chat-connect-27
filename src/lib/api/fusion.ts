import { makeProviderRequest } from './providers';

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

  const activeProviders = Object.keys(apiKeys).filter(
    provider => apiKeys[provider] && selectedModels[provider]
  );

  if (activeProviders.length < 3) {
    throw new Error('Fusion mode requires at least 3 active providers');
  }

  try {
    const responses = await Promise.all(
      activeProviders.map(async provider => {
        try {
          const data = await makeProviderRequest(provider, message, selectedModels[provider]);
          
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

    return activeProviders
      .map((provider, index) => `${provider.toUpperCase()}: ${responses[index]}`)
      .join('\n\n');
  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};