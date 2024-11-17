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

  const activeProviders = Object.keys(apiKeys).filter(
    provider => apiKeys[provider] && selectedModels[provider]
  );

  if (activeProviders.length < 2) {
    throw new Error('Fusion mode requires at least 2 active providers');
  }

  try {
    const formattedPrompt = formatProviderPrompt(message, responseType);
    console.log('Formatted prompt:', formattedPrompt);

    const responses = await Promise.all(
      activeProviders.map(async provider => {
        try {
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

          return {
            provider,
            content: response,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error with ${provider}:`, error);
          return {
            provider,
            content: `[${provider} error: ${error.message}]`,
            timestamp: new Date().toISOString()
          };
        }
      })
    );

    // For coding responses, ensure we preserve code blocks in the final synthesis
    let finalResponse = '';
    if (responseType === 'coding') {
      finalResponse = responses.map(r => 
        `### ${r.provider.toUpperCase()} Response:\n\n${r.content}`
      ).join('\n\n');
    } else {
      finalResponse = responses
        .map(r => `${r.provider.toUpperCase()}: ${r.content}`)
        .join('\n\n');
    }

    return {
      providers: responses,
      final: finalResponse
    };
  } catch (error) {
    throw new Error(`Fusion mode error: ${error.message}`);
  }
};