export const validateProviderApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
  if (!apiKey) {
    console.warn(`No API key provided for ${provider}`);
    return false;
  }

  try {
    // For Claude, check if the API key format is valid (starts with 'sk-ant-' and has sufficient length)
    if (provider === 'claude') {
      const isValid = apiKey.startsWith('sk-ant-') && apiKey.length > 25;
      if (!isValid) {
        console.warn(`Invalid Claude API key format`);
      }
      return isValid;
    }

    // For OpenRouter, check if the API key format is valid
    if (provider === 'openrouter') {
      const isValid = apiKey.startsWith('sk-or-') && apiKey.length > 20;
      if (!isValid) {
        console.warn(`Invalid OpenRouter API key format`);
      }
      return isValid;
    }

    // For OpenAI, check if the API key format is valid
    if (provider === 'openai') {
      const isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
      if (!isValid) {
        console.warn(`Invalid OpenAI API key format`);
      }
      return isValid;
    }

    // For Google, check if the API key format is valid
    if (provider === 'google') {
      const isValid = apiKey.length > 20;
      if (!isValid) {
        console.warn(`Invalid Google API key format`);
      }
      return isValid;
    }

    console.warn(`Unknown provider: ${provider}`);
    return false;
  } catch (error) {
    console.error(`Error validating ${provider} API key:`, error);
    return false;
  }
};