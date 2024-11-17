import { generateFusionResponse } from './fusion-mode';
import { supabase } from "@/integrations/supabase/client";
import { intelligentRouter } from './providers/IntelligentAIRouter';
import type { ResponseType } from '@/types/ai';

interface GenerateResponseOptions {
  message: string;
  responseType?: ResponseType;
}

export const generateResponse = async ({ message, responseType = 'chat' }: GenerateResponseOptions) => {
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

    // Use intelligent routing for single provider mode
    const routedResponse = await intelligentRouter.routeRequest(responseType, message, {
      maxLatency: 5000, // 5 seconds default timeout
      minReliability: 0.8, // 80% minimum success rate
    });

    console.log('Routed response:', routedResponse);

    return routedResponse.response;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};