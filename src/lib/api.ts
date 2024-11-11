import { supabase } from "@/integrations/supabase/client";

export const makeAIRequest = async (provider: string, message: string, model: string) => {
  try {
    const { data: response, error } = await supabase.functions.invoke('api-handler', {
      body: { provider, message, model },
    });

    if (error) throw error;
    return response;
  } catch (error) {
    console.error('Error making AI request:', error);
    throw error;
  }
};