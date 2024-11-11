interface ProviderConfig {
  endpoint: string | ((model: string) => string);
  headers: Record<string, string>;
  formatBody: (message: string, model: string) => any;
  extractResponse: (data: any) => string;
}

const API_BASE_URL = 'https://fusion-chat-connect.gptengineer.app';

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    endpoint: `${API_BASE_URL}/api/openai`,
    headers: {},
    formatBody: (message, model) => ({
      model,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7
    }),
    extractResponse: data => data.choices[0].message.content
  },
  claude: {
    endpoint: `${API_BASE_URL}/api/claude`,
    headers: { 'anthropic-version': '2023-06-01' },
    formatBody: (message, model) => ({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000
    }),
    extractResponse: data => data.content[0].text
  },
  google: {
    endpoint: `${API_BASE_URL}/api/google`,
    headers: {},
    formatBody: (message, model) => ({
      model,
      prompt: { text: message },
      temperature: 0.7,
      candidate_count: 1
    }),
    extractResponse: data => data.candidates[0].output
  },
  openrouter: {
    endpoint: `${API_BASE_URL}/api/openrouter`,
    headers: {},
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

  const endpoint = typeof config.endpoint === 'function' 
    ? config.endpoint(model)
    : config.endpoint;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...config.headers
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(config.formatBody(message, model))
  });

  if (!response.ok) {
    throw new Error(`${provider} API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return config.extractResponse(data);
};