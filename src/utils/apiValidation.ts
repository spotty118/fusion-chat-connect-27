export const validateProviderApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;

  try {
    if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok;
    }

    // For OpenRouter, we'll just check if the API key format is valid
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