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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    const { data, error } = await supabase.functions.invoke('api-handler', {
      body: { provider, message, model, apiKey },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) throw error;

    // Extract the response based on the provider
    switch (provider) {
      case 'openai':
        return data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
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