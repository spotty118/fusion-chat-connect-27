import { generateFusionResponse } from './fusion-mode';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const AUTH_COOKIE_NAME = 'window_ai_verified';

interface WindowAIResponse {
  message?: { content: string };
  text?: string;
  delta?: { content: string };
}

const isVerified = () => {
  return document.cookie.includes(AUTH_COOKIE_NAME);
};

const setVerified = () => {
  const date = new Date();
  date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
  document.cookie = `${AUTH_COOKIE_NAME}=true; expires=${date.toUTCString()}; path=/`;
};

const waitForWindowAI = async (retries = 0): Promise<boolean> => {
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
  // Don't check Window.ai if fusion mode is active
  if (localStorage.getItem('fusionMode') === 'true') {
    return false;
  }
  
  if (isVerified()) {
    return true;
  }
  return waitForWindowAI();
};

export const generateResponse = async (message: string, fusionMode = false) => {
  try {
    // If fusion mode is active, bypass Window.ai completely
    if (fusionMode || localStorage.getItem('fusionMode') === 'true') {
      const response = await generateFusionResponse(message);
      return {
        final: response.final,
        providers: response.providers
      };
    }

    await checkWindowAI();
    
    const response = await window.ai.generateText({
      messages: [{ role: "user", content: message }]
    });

    // Handle different response formats from Window AI
    if (typeof response === 'string') {
      return response;
    }

    if (!response) {
      throw new Error('No response received from Window AI');
    }

    // Handle array response format
    if (Array.isArray(response)) {
      const firstResponse = response[0] as WindowAIResponse;
      if (!firstResponse) {
        throw new Error('Empty response from Window AI');
      }

      if (typeof firstResponse === 'string') return firstResponse;
      if ('message' in firstResponse && firstResponse.message?.content) return firstResponse.message.content;
      if ('text' in firstResponse && firstResponse.text) return firstResponse.text;
      if ('delta' in firstResponse && firstResponse.delta?.content) return firstResponse.delta.content;
    }

    // Handle object response format
    const objectResponse = response as WindowAIResponse;
    if (typeof objectResponse === 'object') {
      if ('message' in objectResponse && objectResponse.message?.content) return objectResponse.message.content;
      if ('text' in objectResponse && objectResponse.text) return objectResponse.text;
      if ('delta' in objectResponse && objectResponse.delta?.content) return objectResponse.delta.content;
    }
    
    throw new Error('Unrecognized response format from Window AI');
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};