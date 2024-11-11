const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const AUTH_COOKIE_NAME = 'window_ai_verified';
const CACHE_PREFIX = 'fusion_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

const isVerified = () => {
  return document.cookie.includes(AUTH_COOKIE_NAME);
};

const setVerified = () => {
  const date = new Date();
  date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
  document.cookie = `${AUTH_COOKIE_NAME}=true; expires=${date.toUTCString()}; path=/`;
};

const getCacheKey = (message, model) => {
  return `${CACHE_PREFIX}${model}_${btoa(message)}`;
};

const getFromCache = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const { value, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_EXPIRY) {
    localStorage.removeItem(key);
    return null;
  }
  return value;
};

const setInCache = (key, value) => {
  localStorage.setItem(key, JSON.stringify({
    value,
    timestamp: Date.now()
  }));
};

const waitForWindowAI = async (retries = 0) => {
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

export const checkWindowAI = async () => {
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  if (fusionMode) {
    return true; // Skip Window.ai check in fusion mode
  }
  
  if (isVerified()) {
    return true;
  }
  return waitForWindowAI();
};

const generateFusionResponse = async (message) => {
  // Implement fusion mode logic here using the stored API keys and models
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

  // For now, return a placeholder response
  return "Fusion mode is active but the implementation is pending. Please implement the actual API calls to the selected providers.";
};

export const generateResponse = async (message, fusionMode = false) => {
  try {
    if (fusionMode) {
      return await generateFusionResponse(message);
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
