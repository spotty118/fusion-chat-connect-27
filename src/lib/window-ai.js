const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const AUTH_COOKIE_NAME = 'window_ai_verified';

const isVerified = () => {
  return document.cookie.includes(AUTH_COOKIE_NAME);
};

const setVerified = () => {
  const date = new Date();
  date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
  document.cookie = `${AUTH_COOKIE_NAME}=true; expires=${date.toUTCString()}; path=/`;
};

const makeProviderRequest = async (provider, apiKey, model, message) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  let endpoint, body;

  switch (provider) {
    case 'openai':
      endpoint = 'https://api.openai.com/v1/chat/completions';
      body = {
        model,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      };
      break;

    case 'claude':
      endpoint = 'https://api.anthropic.com/v1/messages';
      body = {
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      };
      headers['anthropic-version'] = '2023-06-01';
      break;

    case 'google':
      endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateText`;
      body = {
        prompt: { text: message },
        temperature: 0.7,
        candidate_count: 1
      };
      headers['x-goog-api-key'] = apiKey;
      break;

    case 'openrouter':
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      body = {
        model,
        messages: [{ role: 'user', content: message }]
      };
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`${provider} API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Extract the response text based on provider-specific response format
  switch (provider) {
    case 'openai':
    case 'openrouter':
      return data.choices[0].message.content;
    case 'claude':
      return data.content[0].text;
    case 'google':
      return data.candidates[0].output;
    default:
      throw new Error(`Unknown provider response format: ${provider}`);
  }
};

const generateFusionResponse = async (message) => {
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
          apiKeys[provider],
          selectedModels[provider],
          message
        ).catch(error => {
          console.error(`Error with ${provider}:`, error);
          return `[${provider} error: ${error.message}]`;
        })
      )
    );

    // Combine responses with provider names
    const combinedResponse = activeProviders
      .map((provider, index) => `${provider.toUpperCase()}: ${responses[index]}`)
      .join('\n\n');

    return combinedResponse;
  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};

export const checkWindowAI = async () => {
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  
  // If fusion mode is active, prevent window.ai from being used
  if (fusionMode) {
    throw new Error('Window AI is disabled while Fusion Mode is active');
  }
  
  if (isVerified()) {
    return true;
  }
  return waitForWindowAI();
};

const waitForWindowAI = async (retries = 0) => {
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  
  // If fusion mode is active, prevent window.ai from being used
  if (fusionMode) {
    throw new Error('Window AI is disabled while Fusion Mode is active');
  }

  if (typeof window !== 'undefined' && window?.ai) {
    if (!isVerified()) {
      setVerified();
    }
    return true;
  }

  if (retries >= MAX_RETRIES && !isVerified()) {
    throw new Error(
      "Window AI not found! Please install the Chrome extension: https://windowai.io"
    );
  }

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  return waitForWindowAI(retries + 1);
};

export const generateResponse = async (message, fusionMode = false) => {
  try {
    if (fusionMode) {
      return await generateFusionResponse(message);
    }

    // Check if fusion mode is active before attempting to use window.ai
    if (localStorage.getItem('fusionMode') === 'true') {
      throw new Error('Window AI is disabled while Fusion Mode is active');
    }

    await checkWindowAI();
    
    const response = await window.ai.generateText({
      messages: [{ role: "user", content: message }]
    });
    
    if (!response?.length) {
      throw new Error('No response received from Window AI');
    }

    const choice = response[0];
    if (choice.message?.content) return choice.message.content;
    if (choice.text) return choice.text;
    if (choice.delta?.content) return choice.delta.content;
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};