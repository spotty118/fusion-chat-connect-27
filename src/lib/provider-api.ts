interface ProviderConfig {
  endpoint: string;
  headers: Record<string, string>;
  formatBody: (message: string, model: string) => any;
  extractResponse: (data: any) => string;
}

const API_BASE_URL = 'https://fusion-chat-connect.gptengineer.app';

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    endpoint: `${API_BASE_URL}/api/chat/openai`,
    headers: {
      'Content-Type': 'application/json'
    },
    formatBody: (message, model) => ({
      model,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7
    }),
    extractResponse: data => data.choices[0].message.content
  },
  claude: {
    endpoint: `${API_BASE_URL}/api/chat/claude`,
    headers: {
      'Content-Type': 'application/json'
    },
    formatBody: (message, model) => ({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000
    }),
    extractResponse: data => data.content[0].text
  },
  google: {
    endpoint: `${API_BASE_URL}/api/chat/google`,
    headers: {
      'Content-Type': 'application/json'
    },
    formatBody: (message, model) => ({
      model,
      prompt: { text: message },
      temperature: 0.7,
      candidate_count: 1
    }),
    extractResponse: data => data.candidates[0].output
  },
  openrouter: {
    endpoint: `${API_BASE_URL}/api/chat/openrouter`,
    headers: {
      'Content-Type': 'application/json'
    },
    formatBody: (message, model) => ({
      model,
      messages: [{ role: 'user', content: message }]
    }),
    extractResponse: data => data.choices[0].message.content
  }
};

export const makeProviderRequest = async (
  provider: string,
  apiKey: string,
  model: string,
  message: string
): Promise<string> => {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) throw new Error(`Unsupported provider: ${provider}`);

  const headers = {
    ...config.headers,
    'Authorization': `Bearer ${apiKey}`,
    'x-requested-with': 'XMLHttpRequest'
  };

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...config.formatBody(message, model),
        apiKey,
        provider // Add provider to help backend route the request
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider} API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return config.extractResponse(data);
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw error;
  }
};