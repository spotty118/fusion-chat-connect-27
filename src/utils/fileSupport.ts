import { supabase } from "@/integrations/supabase/client";

export const supportsFileAttachments = async (provider: string, model: string): Promise<boolean> => {
  if (!provider || !model) return false;

  try {
    console.log('Checking file support for:', { provider, model }); // Debug log
    
    const { data, error } = await supabase.functions.invoke('check-file-support', {
      body: { provider, model },
    });

    if (error) {
      console.warn('Error checking file support:', error);
      return false;
    }

    console.log('File support response:', data); // Debug log
    return data?.supportsFiles || false;
  } catch (error) {
    console.warn('Error checking file support:', error);
    return false;
  }
};