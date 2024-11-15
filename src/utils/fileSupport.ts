import { supabase } from "@/integrations/supabase/client";

export const supportsFileAttachments = async (provider: string, model: string): Promise<boolean> => {
  if (!provider || !model) {
    console.warn('Missing provider or model:', { provider, model });
    return false;
  }

  try {
    const requestBody = { 
      provider: provider.trim(),
      model: model.trim()
    };
    console.log('Sending request:', requestBody);

    const { data, error } = await supabase.functions.invoke('check-file-support', {
      body: requestBody
    });

    if (error) {
      console.warn('Error checking file support:', error.message);
      return false;
    }

    if (data === null || typeof data.supportsFiles !== 'boolean') {
      console.warn('Invalid response format:', data);
      return false;
    }

    return data.supportsFiles;
  } catch (error) {
    console.warn('Error checking file support:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};