import { generateFusionResponse } from './fusion-mode';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface AIResponseMessage {
  content: string;
}

interface AIResponseDelta {
  content: string;
}

interface AIResponseChoice {
  message?: AIResponseMessage;
  text?: string;
  delta?: AIResponseDelta;
}

const waitForWindowAI = async (retries = 0): Promise<boolean> => {
  // First check if we're in fusion mode
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  if (fusionMode) {
    return true; // Skip Window AI check in fusion mode
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Window AI is only available in browser environments');
  }

  // Check if Window AI extension is installed
  if (!window.ai) {
    throw new Error("Window AI not found! Please install the Chrome extension: https://windowai.io");
  }

  // Verify required methods exist
  if (!window.ai.generateText || !window.ai.getCurrentModel) {
    throw new Error("Window AI extension is not properly initialized. Please refresh the page.");
  }

  // Verify model selection and authentication
  try {
    const model = await window.ai.getCurrentModel();
    if (!model) {
      throw new Error('Please select a model in the Window AI extension');
    }
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_AUTHENTICATED') {
        throw new Error('Please authenticate with Window AI extension first. Click the extension icon and sign in.');
      }
      if (error.message.includes('model')) {
        throw new Error('Please select a model in the Window AI extension and refresh the page');
      }
    }
    throw error;
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

    // Check Window AI status before attempting to generate
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
      const firstResponse = response[0] as AIResponseChoice;
      if (!firstResponse) {
        throw new Error('Empty response from Window AI');
      }

      if (typeof firstResponse === 'string') return firstResponse;
      if ('message' in firstResponse && firstResponse.message?.content) return firstResponse.message.content;
      if ('text' in firstResponse && firstResponse.text) return firstResponse.text;
      if ('delta' in firstResponse && firstResponse.delta?.content) return firstResponse.delta.content;
    }

    if (typeof response === 'object' && response !== null) {
      const objectResponse = response as AIResponseChoice;
      if ('message' in objectResponse && objectResponse.message?.content) return objectResponse.message.content;
      if ('text' in objectResponse && objectResponse.text) return objectResponse.text;
      if ('delta' in objectResponse && objectResponse.delta?.content) return objectResponse.delta.content;
    }
    
    throw new Error('Unrecognized response format from Window AI');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_AUTHENTICATED') {
        throw new Error('Please authenticate with Window AI extension first. Click the extension icon and sign in.');
      }
      console.error("Error generating response:", error);
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};