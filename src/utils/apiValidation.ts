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

    // For other providers, use their respective endpoints
    const endpoints = {
      openai: 'https://api.openai.com/v1/models',
      google: 'https://generativelanguage.googleapis.com/v1beta/models',
      openrouter: 'https://openrouter.ai/api/v1/models',
    };

    if (!endpoints[provider as keyof typeof endpoints]) {
      return false;
    }

    const response = await fetch(endpoints[provider as keyof typeof endpoints], {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};