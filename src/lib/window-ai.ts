import { generateFusionResponse } from './fusion-mode';
import { fetchModelsFromBackend } from '../api/modelsApi';
import { supabase } from "@/integrations/supabase/client";

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

export const checkWindowAI = async () => {
  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  
  if (fusionMode) {
    return true;
  }
  
  const manualApiKey = localStorage.getItem('manualApiKey');
  const manualModel = localStorage.getItem('manualModel');
  
  // If manual configuration exists, verify it
  if (manualApiKey && manualModel) {
    try {
      const models = await fetchModelsFromBackend('openai', manualApiKey);
      if (models.includes(manualModel)) {
        return true;
      }
    } catch (error) {
      console.warn('Manual API configuration validation failed:', error);
    }
  }

  // Check Window AI availability
  if (typeof window === 'undefined') {
    throw new Error('Window AI is only available in browser environments');
  }

  if (!window.ai) {
    // Instead of throwing error, we'll check for fallback configuration
    const models = await fetchModelsFromBackend('openai', manualApiKey || '');
    if (models.length > 0) {
      return true;
    }
    throw new Error("Window AI not found! Please install the Chrome extension: https://windowai.io or configure manual API settings");
  }

  if (!window.ai.generateText || !window.ai.getCurrentModel) {
    throw new Error("Window AI extension is not properly initialized. Please refresh the page or use manual API settings");
  }

  try {
    const model = await window.ai.getCurrentModel();
    if (!model) {
      // If no model selected in Window AI, check for fallback models
      const models = await fetchModelsFromBackend('openai', manualApiKey || '');
      if (models.length > 0) {
        return true;
      }
      throw new Error('Please select a model in the Window AI extension or configure manual API settings');
    }
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_AUTHENTICATED') {
        // Check for fallback models when Window AI is not authenticated
        const models = await fetchModelsFromBackend('openai', manualApiKey || '');
        if (models.length > 0) {
          return true;
        }
        throw new Error('Please authenticate with Window AI extension or configure manual API settings');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
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

    // Check for manual configuration first
    const manualApiKey = localStorage.getItem('manualApiKey');
    const manualModel = localStorage.getItem('manualModel');
    
    if (manualApiKey && manualModel) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      const { data, error } = await supabase.functions.invoke('api-handler', {
        body: { 
          provider: 'openai',
          message,
          model: manualModel,
          apiKey: manualApiKey
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) throw error;
      return data.choices[0].message.content;
    }

    // Try Window AI if no manual configuration
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
        throw new Error('Please authenticate with Window AI extension or configure manual API settings');
      }
      console.error("Error generating response:", error);
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};