import { generateFusionResponse } from './fusion-mode';
import { supabase } from "@/integrations/supabase/client";

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

    // Use manual configuration
    const manualApiKey = localStorage.getItem('manualApiKey');
    const manualModel = localStorage.getItem('manualModel');
    
    if (!manualApiKey || !manualModel) {
      throw new Error('No API configuration found. Please configure your API settings.');
    }

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
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};