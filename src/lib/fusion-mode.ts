import { supabase } from "@/integrations/supabase/client";

const combineResponsesWithAI = async (responses: { provider: string; response: string }[]): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const prompt = `You are an expert at analyzing and combining AI responses. Here are ${responses.length} different AI responses to the same prompt. Please analyze them and create one coherent, accurate, and well-written response that captures the best elements from all responses while maintaining a natural flow:

Responses to analyze:
${responses.map((r, i) => `Response ${i + 1} from ${r.provider}:\n${r.response}`).join('\n\n')}

Create one optimal response that:
1. Combines the most accurate and relevant information
2. Eliminates redundancy
3. Maintains a natural, conversational flow
4. Preserves the most insightful elements from each response`;

    const { data, error } = await supabase.functions.invoke('api-handler', {
      body: {
        provider: 'openai',
        message: prompt,
        model: 'gpt-4o-mini',
        apiKey: localStorage.getItem('openai_key')
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) throw error;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error combining responses with AI:', error);
    // Fallback to simple combination if AI processing fails
    return responses.map(r => r.response).join(' ');
  }
};

export const generateFusionResponse = async (message: string) => {
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

  try {
    const responses = await Promise.all(
      activeProviders.map(async provider => {
        try {
          const { data, error } = await supabase.functions.invoke('api-handler', {
            body: {
              provider,
              message,
              model: selectedModels[provider],
              apiKey: apiKeys[provider]
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          if (error) throw error;

          let response;
          switch (provider) {
            case 'openai':
            case 'openrouter':
              response = data.choices[0].message.content;
              break;
            case 'claude':
              response = data.content[0].text;
              break;
            case 'google':
              response = data.candidates[0].output;
              break;
            default:
              throw new Error(`Unsupported provider: ${provider}`);
          }
          return { provider, response };
        } catch (error) {
          console.error(`Error with ${provider}:`, error);
          return { provider, response: `Error: ${error.message}` };
        }
      })
    );

    // Filter out error responses
    const validResponses = responses.filter(r => !r.response.startsWith('Error:'));
    if (validResponses.length === 0) {
      throw new Error('All providers failed to generate a response');
    }

    // Use OpenAI to combine and optimize the responses
    return await combineResponsesWithAI(validResponses);

  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};