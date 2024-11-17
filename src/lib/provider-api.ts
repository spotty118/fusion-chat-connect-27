import { supabase } from "@/integrations/supabase/client";

export const makeProviderRequest = async (
  provider: string,
  apiKey: string,
  model: string,
  message: string
): Promise<string> => {
  try {
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