import { supabase } from "@/integrations/supabase/client";

export const supportsFileAttachments = async (provider: string, model: string): Promise<boolean> => {
  if (!provider || !model) return false;

  try {
    const { data, error } = await supabase.functions.invoke('check-file-support', {
      body: { provider, model }
    });

    if (error) {
      console.warn('Error checking file support:', error.message);
      return false;
    }

    return data?.supportsFiles || false;
  } catch (error) {
    console.warn('Error checking file support:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};