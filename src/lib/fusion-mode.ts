import { makeProviderRequest } from './provider-api';
import { ResponseType } from '@/components/ResponseTypeSelector';
import { intelligentRouter } from './providers/IntelligentAIRouter';

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

const validateProviderResponse = (response: any): boolean => {
  return response && typeof response === 'string' && response.length > 0;
};

export const generateFusionResponse = async (message: string, responseType: ResponseType = 'general'): Promise<FusionResponse> => {
  console.log('Generating fusion response with type:', responseType);
  
  // Get only enabled providers
  const enabledProviders = ['openai', 'claude', 'google', 'openrouter'].filter(provider => {
    const isEnabled = localStorage.getItem(`${provider}_enabled`) === 'true';
    const hasKey = localStorage.getItem(`${provider}_key`)?.length > 0;
    const hasModel = localStorage.getItem(`${provider}_model`)?.length > 0;
    console.log(`Provider ${provider} status:`, { isEnabled, hasKey, hasModel });
    return isEnabled && hasKey && hasModel;
  });

  console.log('Enabled and configured providers:', enabledProviders);

  if (enabledProviders.length < 2) {
    console.error('Not enough active providers:', enabledProviders.length);
    throw new Error(`Fusion mode requires at least 2 active and configured providers. Currently have ${enabledProviders.length} configured.`);
  }

  try {
    const formattedPrompt = formatProviderPrompt(message, responseType);
    console.log('Formatted prompt:', formattedPrompt);

    // Get responses from all enabled providers
    const responses = await Promise.allSettled(
      enabledProviders.map(async provider => {
        try {
          console.log(`Making request to provider: ${provider}`);
          const model = localStorage.getItem(`${provider}_model`) || '';
          const apiKey = localStorage.getItem(`${provider}_key`) || '';
          
          const response = await makeProviderRequest(
            provider,
            apiKey,
            model,
            formattedPrompt
          );

          if (!validateProviderResponse(response)) {
            throw new Error(`Invalid response format from ${provider}`);
          }

          console.log(`Successful response from ${provider}`);
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

    // Filter out failed responses and extract values from fulfilled promises
    const validResponses = responses
      .filter((result): result is PromiseFulfilledResult<ProviderResponse> => 
        result.status === 'fulfilled' && !result.value.content.startsWith('Error:'))
      .map(result => result.value);

    if (validResponses.length === 0) {
      throw new Error('No valid responses received from any provider');
    }

    // Use intelligent routing to synthesize the best response
    const routedResponse = await intelligentRouter.routeRequest({
      message: formattedPrompt,
      responseType,
      maxLatency: 5000,
      minReliability: 0.8,
      availableProviders: enabledProviders // Pass enabled providers to router
    });

    console.log('Routed response:', routedResponse);

    return {
      providers: validResponses,
      final: routedResponse.response || 'No valid responses received from any provider.'
    };
  } catch (error) {
    console.error('Fusion mode error:', error);
    throw error;
  }
};