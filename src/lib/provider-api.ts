import { supabase } from "@/integrations/supabase/client";

export const makeProviderRequest = async (
  provider: string,
  apiKey: string,
  model: string,
  message: string
): Promise<string> => {
  try {
    // Check if provider is enabled before making request
    const isEnabled = localStorage.getItem(`${provider}_enabled`) === 'true';
    if (!isEnabled) {
      console.log(`Provider ${provider} is disabled, skipping request`);
      throw new Error(`Provider ${provider} is disabled`);
    }

    console.log('Sending request:', { provider, model, messageLength: message.length });

    const { data, error } = await supabase.functions.invoke('api-handler', {
      body: { provider, message, model, apiKey }
    });

    if (error) {
      console.error(`Error with ${provider}:`, error);
      throw error;
    }

    if (!data || !data.content) {
      throw new Error(`Invalid response format from ${provider}`);
    }

    return data.content;
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw error;
  }
};