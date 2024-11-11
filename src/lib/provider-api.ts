import { supabase } from "@/integrations/supabase/client";

interface ProviderResponse {
  content: string;
}

export const makeProviderRequest = async (
  provider: string,
  apiKey: string,
  model: string,
  message: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('api-handler', {
      body: { provider, message, model },
    });

    if (error) throw error;

    // Extract the response based on the provider
    switch (provider) {
      case 'openai':
      case 'openrouter':
        return data.choices[0].message.content;
      case 'claude':
        return data.content[0].text;
      case 'google':
        return data.candidates[0].output;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw error;
  }
};