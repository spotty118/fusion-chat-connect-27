import { supabase } from "@/integrations/supabase/client";

export const makeProviderRequest = async (provider: string, message: string, model: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('api-handler', {
      body: { provider, message, model }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw error;
  }
};