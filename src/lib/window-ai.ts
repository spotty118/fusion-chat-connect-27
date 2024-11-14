import { generateFusionResponse } from './fusion-mode';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const AUTH_COOKIE_NAME = 'window_ai_verified';

interface AIResponse {
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
  // First check if we're in fusion mode
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  if (fusionMode) {
    return true; // Skip Window AI check in fusion mode
  }

  // Basic check for window.ai existence
  if (typeof window === 'undefined' || !window.ai) {
    if (retries >= MAX_RETRIES) {
      throw new Error("Window AI not found! Please install the Chrome extension: https://windowai.io");
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return waitForWindowAI(retries + 1);
  }

  // Extension exists, verify functionality
  try {
    // Try to get current model as a test
    await window.ai.getCurrentModel();
    if (!isVerified()) {
      setVerified();
    }
    return true;
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      throw new Error("Window AI extension needs to be updated or reconfigured. Please check your extension settings.");
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return waitForWindowAI(retries + 1);
  }
};

export const checkWindowAI = async () => {
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  if (fusionMode) {
    return true;
  }
  return waitForWindowAI();
};

export const generateResponse = async (message: string) => {
  try {
    const fusionMode = localStorage.getItem('fusionMode') === 'true';

    if (fusionMode) {
      const response = await generateFusionResponse(message);
      if (!response || !response.providers || !response.final) {
        throw new Error('Invalid fusion response format');
      }
      return response;
    }

    await checkWindowAI();
    
    const response = await window.ai.generateText({
      messages: [{ role: "user", content: message }]
    });

    if (!response) {
      throw new Error('No response received from Window AI');
    }

    if (typeof response === 'string') {
      return response;
    }

    if (Array.isArray(response)) {
      const firstResponse = response[0] as AIResponse;
      if (!firstResponse) {
        throw new Error('Empty response from Window AI');
      }

      if (typeof firstResponse === 'string') return firstResponse;
      if (firstResponse.message?.content) return firstResponse.message.content;
      if (firstResponse.text) return firstResponse.text;
      if (firstResponse.delta?.content) return firstResponse.delta.content;
    }

    const objectResponse = response as AIResponse;
    if (typeof objectResponse === 'object') {
      if (objectResponse.message?.content) return objectResponse.message.content;
      if (objectResponse.text) return objectResponse.text;
      if (objectResponse.delta?.content) return objectResponse.delta.content;
    }
    
    throw new Error('Unrecognized response format from Window AI');
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};