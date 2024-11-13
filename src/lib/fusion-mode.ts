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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Please sign in to use Fusion Mode');
  }

  const { data: apiKeysData, error: apiKeysError } = await supabase
    .from('api_keys')
    .select('provider, api_key')
    .eq('user_id', session.user.id);

  if (apiKeysError) {
    console.error('Failed to fetch API keys:', apiKeysError);
    throw new Error('Failed to fetch API keys');
  }

  if (!apiKeysData || apiKeysData.length === 0) {
    throw new Error('No API keys found. Please add your API keys in the settings.');
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

  const response = await generateMultiAgentResponse(message, apiKeys, selectedModels);
  
  // Ensure the response matches the FusionResponse interface
  if (!response || typeof response !== 'object' || !('final' in response) || !('providers' in response)) {
    throw new Error('Invalid response format from multi-agent system');
  }

  return response as FusionResponse;
};