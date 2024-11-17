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
  
  const apiKeys = {
    openai: localStorage.getItem('openai_key'),
    claude: localStorage.getItem('claude_key'),
    google: localStorage.getItem('google_key'),
    openrouter: localStorage.getItem('openrouter_key')
  };

  const selectedModels = {
    openai: localStorage.getItem('openai_model'),
    claude: localStorage.getItem('claude_model'),
    google: localStorage.getItem('google_model'),
    openrouter: localStorage.getItem('openrouter_model')
  };

  // Check which providers are enabled
  const enabledProviders = Object.keys(apiKeys).filter(provider => 
    localStorage.getItem(`${provider}_enabled`) === 'true' &&
    apiKeys[provider] && 
    selectedModels[provider]
  );

  console.log('Enabled providers:', enabledProviders);

  if (enabledProviders.length < 2) {
    throw new Error('Fusion mode requires at least 2 active and enabled providers');
  }

  try {
    const formattedPrompt = formatProviderPrompt(message, responseType);
    console.log('Formatted prompt:', formattedPrompt);

    const responses = await Promise.all(
      enabledProviders.map(async provider => {
        try {
          console.log(`Making request to provider: ${provider}`);
          const data = await makeProviderRequest(provider, formattedPrompt, selectedModels[provider]);
          
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
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};