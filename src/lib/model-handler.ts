import { generateFusionResponse } from './fusion-mode';
import { supabase } from "@/integrations/supabase/client";
import type { ResponseType } from '@/components/ResponseTypeSelector';

interface GenerateResponseOptions {
  message: string;
  responseType?: ResponseType;
}

export const generateResponse = async ({ message, responseType = 'general' }: GenerateResponseOptions) => {
  try {
    const fusionMode = localStorage.getItem('fusionMode') === 'true';
    console.log('Generating response with type:', responseType);

    if (fusionMode) {
      const response = await generateFusionResponse(message, responseType);
      if (!response || !response.providers || !response.final) {
        throw new Error('Invalid fusion response format');
      }
      return response;
    }

    // Use manual configuration with provider-specific keys
    const manualProvider = localStorage.getItem('manualProvider') || 'openai';
    const manualApiKey = localStorage.getItem(`${manualProvider}_key`);
    const manualModel = localStorage.getItem(`${manualProvider}_model`);
    
    if (!manualApiKey || !manualModel) {
      throw new Error('No API configuration found. Please configure your API settings.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    const { data, error } = await supabase.functions.invoke('api-handler', {
      body: { 
        provider: manualProvider,
        message,
        model: manualModel,
        apiKey: manualApiKey,
        responseType
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) throw error;

    // Extract the response based on the provider
    switch (manualProvider) {
      case 'openai':
      case 'openrouter':
        return data.choices[0].message.content;
      case 'claude':
        return data.content[0].text;
      case 'google':
        return data.candidates[0].output;
      default:
        throw new Error(`Unsupported provider: ${manualProvider}`);
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};