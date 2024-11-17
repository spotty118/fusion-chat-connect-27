import { supabase } from "@/integrations/supabase/client";
import { generateMultiAgentResponse } from './multi-agent';
import type { ResponseType } from '@/components/ResponseTypeSelector';

export interface FusionResponse {
  final: string;
  providers: Array<{
    provider: string;
    role: string;
    response: string;
  }>;
}

export const generateFusionResponse = async (message: string, responseType: ResponseType = 'general'): Promise<FusionResponse> => {
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

    // Check which providers are enabled
    const enabledProviders = Object.keys(apiKeys).filter(provider => 
      localStorage.getItem(`${provider}_enabled`) !== 'false'
    );

    console.log('Enabled providers:', enabledProviders);

    // Only include providers that have both an API key, a selected model, and are enabled
    const activeProviders = Object.keys(apiKeys).filter(provider => {
      const hasApiKey = apiKeys[provider] && apiKeys[provider].length > 0;
      const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
      const isEnabled = enabledProviders.includes(provider);
      
      console.log(`Provider ${provider}:`, {
        hasApiKey,
        hasModel,
        isEnabled
      });
      
      return hasApiKey && hasModel && isEnabled;
    });

    console.log('Active providers:', activeProviders);

    if (activeProviders.length < 3) {
      const configuredCount = activeProviders.length;
      const missingProviders = Object.keys(apiKeys)
        .filter(provider => !activeProviders.includes(provider))
        .map(provider => {
          const hasApiKey = apiKeys[provider] && apiKeys[provider].length > 0;
          const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
          const isEnabled = enabledProviders.includes(provider);
          
          if (!hasApiKey) return `${provider} (missing API key)`;
          if (!hasModel) return `${provider} (no model selected)`;
          if (!isEnabled) return `${provider} (disabled)`;
          return provider;
        });

      throw new Error(
        `Fusion mode requires at least 3 active providers. Currently active: ${configuredCount}. ` +
        `Missing configuration for: ${missingProviders.join(', ')}. ` +
        'Please ensure you have both API keys and models selected for at least 3 providers, and that they are enabled.'
      );
    }

    // Filter apiKeys and selectedModels to only include active providers
    const filteredApiKeys: Record<string, string> = {};
    const filteredModels: Record<string, string> = {};
    
    activeProviders.forEach(provider => {
      filteredApiKeys[provider] = apiKeys[provider];
      filteredModels[provider] = selectedModels[provider] || '';
    });

    const response = await generateMultiAgentResponse(message, filteredApiKeys, filteredModels, responseType);
    
    if (!response || typeof response !== 'object' || !('final' in response) || !('providers' in response)) {
      throw new Error('Invalid response format from multi-agent system');
    }

    return response as FusionResponse;

  } catch (error) {
    console.error('Error in multi-agent response:', error);
    throw error;
  }
};