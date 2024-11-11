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
  if (isVerified()) {
    return true;
  }
  return waitForWindowAI();
};

const addCacheControl = (message, provider) => {
  if (provider !== 'anthropic' || typeof message !== 'string' || message.length < 1024) {
    return message;
  }

  return {
    role: "user",
    content: [
      { type: "text", text: message.substring(0, 100) },
      {
        type: "text",
        text: message.substring(100),
        cache_control: { type: "ephemeral" }
      }
    ]
  };
};

const generateSingleResponse = async (message, model) => {
  try {
    const provider = model.split('/')[0];
    const cacheKey = getCacheKey(message, model);
    const cachedResponse = getFromCache(cacheKey);
    
    if (cachedResponse) {
      console.log(`Cache hit for ${model}`);
      return cachedResponse;
    }

    const processedMessage = addCacheControl(message, provider);
    const response = await window.ai.generateText({
      messages: [{ role: "user", content: processedMessage }],
      model: model,
    });

    if (!response?.length) {
      throw new Error('No response received');
    }

    const choice = response[0];
    let result = '';
    
    if (choice.message?.content) result = choice.message.content;
    else if (choice.text) result = choice.text;
    else if (choice.delta?.content) result = choice.delta.content;
    else throw new Error('Invalid response format');

    // Cache the response
    if (result.length > 0) {
      setInCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error(`Error with ${model}:`, error);
    return null;
  }
};

const combineResponses = async (responses) => {
  const validResponses = responses
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);

  if (validResponses.length === 0) {
    throw new Error('No valid responses received from any AI provider');
  }

  const combinationPrompt = `
    You are a response curator. Below are different responses from AI models to the same prompt.
    Your task is to create ONE perfect response that combines the best insights from all responses.
    The response should be clear, concise, and well-structured.

    Responses to combine:
    ${validResponses.join('\n\n---\n\n')}

    Create one perfect response:`;

  try {
    const combinedResponse = await window.ai.generateText({
      messages: [{ role: "user", content: combinationPrompt }],
    });

    if (!combinedResponse?.length) {
      throw new Error('No combined response received');
    }

    const choice = combinedResponse[0];
    if (choice.message?.content) return choice.message.content;
    if (choice.text) return choice.text;
    if (choice.delta?.content) return choice.delta.content;

    throw new Error('Invalid combined response format');
  } catch (error) {
    console.error("Error combining responses:", error);
    return validResponses[0];
  }
};

export const generateResponse = async (message, fusionMode = false) => {
  try {
    await checkWindowAI();
    
    if (fusionMode) {
      const responses = await Promise.allSettled([
        generateSingleResponse(message, "openai/gpt-4"),
        generateSingleResponse(message, "anthropic/claude-2"),
        generateSingleResponse(message, "google/palm-2")
      ]);

      return await combineResponses(responses);
    } else {
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
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};