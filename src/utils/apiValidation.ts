export const validateProviderApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;

  try {
    // For Claude, check if the API key format is valid (starts with 'sk-ant-' and has sufficient length)
    if (provider === 'claude') {
      return apiKey.startsWith('sk-ant-') && apiKey.length > 25;
    }

    // For OpenRouter, check if the API key format is valid
    if (provider === 'openrouter') {
      return apiKey.startsWith('sk-or-') && apiKey.length > 20;
    }

    // For OpenAI, check if the API key format is valid
    if (provider === 'openai') {
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    // For Google, check if the API key format is valid
    if (provider === 'google') {
      return apiKey.length > 20;
    }

    return false;
  } catch (error) {
    console.warn(`Error validating ${provider} API key:`, error);
    return false;
  }
};