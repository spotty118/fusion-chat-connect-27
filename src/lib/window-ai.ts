import { generateFusionResponse } from './fusion-mode';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const waitForWindowAI = async (retries = 0): Promise<boolean> => {
  // First check if we're in fusion mode
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  if (fusionMode) {
    return true; // Skip Window AI check in fusion mode
  }

  // Wait for window.ai to be defined
  if (typeof window === 'undefined' || !window.ai) {
    if (retries >= MAX_RETRIES) {
      throw new Error("Window AI not found! Please install the Chrome extension: https://windowai.io");
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return waitForWindowAI(retries + 1);
  }

  // Verify the extension is properly initialized
  try {
    const model = await window.ai.getCurrentModel();
    if (!model) {
      throw new Error('No model selected in Window AI');
    }
    return true;
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      throw new Error("Window AI extension is installed but not properly initialized. Please refresh the page or check the extension settings.");
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
      const firstResponse = response[0];
      if (!firstResponse) {
        throw new Error('Empty response from Window AI');
      }

      if (typeof firstResponse === 'string') return firstResponse;
      if ('message' in firstResponse && firstResponse.message?.content) return firstResponse.message.content;
      if ('text' in firstResponse && firstResponse.text) return firstResponse.text;
      if ('delta' in firstResponse && firstResponse.delta?.content) return firstResponse.delta.content;
    }

    if (typeof response === 'object' && response !== null) {
      if ('message' in response && response.message?.content) return response.message.content;
      if ('text' in response && response.text) return response.text;
      if ('delta' in response && response.delta?.content) return response.delta.content;
    }
    
    throw new Error('Unrecognized response format from Window AI');
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};