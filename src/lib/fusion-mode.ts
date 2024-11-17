import { makeProviderRequest } from './api/providers';
import { ResponseType } from '@/components/ResponseTypeSelector';

interface ProviderResponse {
  provider: string;
  content: string;
  timestamp: string;
}

export interface FusionResponse {
  providers: ProviderResponse[];
  final: string;
}

const getSystemPrompt = (responseType: ResponseType) => {
  switch (responseType) {
    case 'coding':
      return `You are a programming assistant. Always provide practical code examples with explanations. 
      Use markdown code blocks with appropriate language tags for all code examples. 
      Format your response to be clear and well-structured with code blocks.`;
    case 'technical':
      return 'You are a technical documentation expert. Provide detailed technical explanations with proper formatting.';
    case 'creative':
      return 'You are a creative writing assistant. Focus on engaging and imaginative content.';
    case 'data':
      return 'You are a data analysis expert. Focus on data insights and visualization suggestions.';
    default:
      return 'You are a helpful assistant. Provide clear and concise responses.';
  }
};

const formatProviderPrompt = (message: string, responseType: ResponseType) => {
  const systemPrompt = getSystemPrompt(responseType);
  return `${systemPrompt}\n\nUser request: ${message}`;
};

export const generateFusionResponse = async (message: string, responseType: ResponseType = 'general'): Promise<FusionResponse> => {
  console.log('Generating fusion response with type:', responseType);
  
  // Get only enabled providers
  const enabledProviders = ['openai', 'claude', 'google', 'openrouter'].filter(provider => {
    const isEnabled = localStorage.getItem(`${provider}_enabled`) === 'true';
    console.log(`Provider ${provider} enabled status:`, isEnabled);
    return isEnabled;
  });

  console.log('Enabled providers:', enabledProviders);

  // Get API keys and models only for enabled providers
  const apiKeys = Object.fromEntries(
    enabledProviders.map(provider => [
      provider,
      localStorage.getItem(`${provider}_key`)
    ])
  );

  const selectedModels = Object.fromEntries(
    enabledProviders.map(provider => [
      provider,
      localStorage.getItem(`${provider}_model`)
    ])
  );

  // Filter out providers without API keys or models
  const activeProviders = enabledProviders.filter(provider => {
    const hasKey = apiKeys[provider] && apiKeys[provider].length > 0;
    const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
    console.log(`Provider ${provider} configuration:`, { hasKey, hasModel });
    return hasKey && hasModel;
  });

  console.log('Active providers with valid configuration:', activeProviders);

  if (activeProviders.length < 2) {
    console.error('Not enough active providers:', activeProviders.length);
    throw new Error(`Fusion mode requires at least 2 active and configured providers. Currently have ${activeProviders.length} configured.`);
  }

  try {
    const formattedPrompt = formatProviderPrompt(message, responseType);
    console.log('Formatted prompt:', formattedPrompt);

    const responses = await Promise.all(
      activeProviders.map(async provider => {
        try {
          console.log(`Making request to provider: ${provider}`);
          const response = await makeProviderRequest(
            provider,
            formattedPrompt,
            selectedModels[provider]
          );

          console.log(`Successful response from ${provider}:`, response);
          return {
            provider,
            content: response,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error with ${provider}:`, error);
          return {
            provider,
            content: `Error: ${error.message}`,
            timestamp: new Date().toISOString()
          };
        }
      })
    );

    // For coding responses, ensure we preserve code blocks in the final synthesis
    let finalResponse = '';
    if (responseType === 'coding') {
      finalResponse = responses
        .filter(r => !r.content.startsWith('Error:'))
        .map(r => `### ${r.provider.toUpperCase()} Response:\n\n${r.content}`)
        .join('\n\n');
    } else {
      finalResponse = responses
        .filter(r => !r.content.startsWith('Error:'))
        .map(r => `${r.provider.toUpperCase()}: ${r.content}`)
        .join('\n\n');
    }

    return {
      providers: responses,
      final: finalResponse || 'No valid responses received from any provider.'
    };
  } catch (error) {
    console.error('Fusion mode error:', error);
    throw error;
  }
};