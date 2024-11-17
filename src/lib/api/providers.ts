import { supabase } from "@/integrations/supabase/client";

export const makeProviderRequest = async (provider: string, message: string, model: string) => {
  try {
    const apiKey = localStorage.getItem(`${provider}_key`);
    if (!apiKey) {
      throw new Error(`No API key found for ${provider}`);
    }

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