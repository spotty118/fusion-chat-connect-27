import { generateFusionResponse } from './fusion-mode';

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
      return await generateFusionResponse(message);
    }

    await checkWindowAI();
    
    const response = await window.ai.generateText({
      messages: [{ role: "user", content: message }]
    });
    
    if (!response || !Array.isArray(response) || response.length === 0) {
      throw new Error('Invalid or empty response received from Window AI');
    }

    const choice = response[0];
    if (!choice) {
      throw new Error('No response choice available');
    }

    if (choice.message?.content) return choice.message.content;
    if (choice.text) return choice.text;
    if (choice.delta?.content) return choice.delta.content;
    
    throw new Error('Response format not recognized');
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};