import { supabase } from "@/integrations/supabase/client";
import { generateMultiAgentResponse } from './multi-agent';

export interface FusionResponse {
  final: string;
  providers: Array<{
    provider: string;
    role: string;
    response: string;
  }>;
}

export const generateFusionResponse = async (message: string): Promise<FusionResponse> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Please sign in to use Fusion Mode');
    }

    // Fetch API keys from Supabase
    let { data: apiKeysData, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('provider, api_key')
      .eq('user_id', session.user.id);

    if (apiKeysError) {
      console.error('Failed to fetch API keys:', apiKeysError);
      throw new Error(`Failed to fetch API keys: ${apiKeysError.message}`);
    }

    // Check local storage as fallback
    const localApiKeys = {
      openai: localStorage.getItem('openai_key'),
      claude: localStorage.getItem('claude_key'),
      google: localStorage.getItem('google_key'),
      openrouter: localStorage.getItem('openrouter_key')
    };

    // Convert local storage keys to the format expected by the rest of the code
    if (!apiKeysData || apiKeysData.length === 0) {
      apiKeysData = Object.entries(localApiKeys)
        .filter(([_, key]) => key && key.length > 0)
        .map(([provider, api_key]) => ({ provider, api_key }));
    }

    const apiKeys: Record<string, string> = {
      openai: '',
      claude: '',
      google: '',
      openrouter: ''
    };

    apiKeysData.forEach(({ provider, api_key }) => {
      if (provider in apiKeys) {
        apiKeys[provider] = api_key;
      }
    });

    const selectedModels = {
      openai: localStorage.getItem('openai_model'),
      claude: localStorage.getItem('claude_model'),
      google: localStorage.getItem('google_model'),
      openrouter: localStorage.getItem('openrouter_model')
    };

    // Only include providers that have both an API key and a selected model
    const activeProviders = Object.keys(apiKeys).filter(provider => {
      const hasApiKey = apiKeys[provider] && apiKeys[provider].length > 0;
      const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
      return hasApiKey && hasModel;
    });

    if (activeProviders.length < 3) {
      throw new Error(
        `Fusion mode requires at least 3 active providers. Currently active: ${activeProviders.length}. ` +
        `Active providers: ${activeProviders.join(', ')}. ` +
        'Please ensure you have both API keys and models selected for at least 3 providers.'
      );
    }

    // Filter apiKeys and selectedModels to only include active providers
    const filteredApiKeys: Record<string, string> = {};
    const filteredModels: Record<string, string> = {};
    
    activeProviders.forEach(provider => {
      filteredApiKeys[provider] = apiKeys[provider];
      filteredModels[provider] = selectedModels[provider] || '';
    });

    const response = await generateMultiAgentResponse(message, filteredApiKeys, filteredModels);
    
    if (!response || typeof response !== 'object' || !('final' in response) || !('providers' in response)) {
      throw new Error('Invalid response format from multi-agent system');
    }

    return response as FusionResponse;

  } catch (error) {
    console.error('Error in multi-agent response:', error);
    throw error;
  }
};