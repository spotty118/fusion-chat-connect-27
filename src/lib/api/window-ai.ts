import { generateFusionResponse } from './fusion';

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

export const checkWindowAI = async () => {
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  
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

export const generateResponse = async (message: string, fusionMode = false) => {
  try {
    if (fusionMode) {
      return await generateFusionResponse(message);
    }

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