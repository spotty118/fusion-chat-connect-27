import { supabase } from "@/integrations/supabase/client";

export const supportsFileAttachments = async (provider: string, model: string): Promise<boolean> => {
  if (!provider || !model) return false;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    const { data, error } = await supabase.functions.invoke('check-file-support', {
      body: { provider, model },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) {
      console.warn('Error checking file support:', error);
      return false;
    }

    return data?.supportsFiles || false;
  } catch (error) {
    console.warn('Error checking file support:', error);
    return false;
  }
};