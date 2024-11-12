import { Agent } from './types';

export const getAgentEndpoint = (provider: string): string => {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    case 'google':
      return 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export const selectBestResponse = (responses: string[]): string => {
  // Select the most comprehensive response (longest that's not an error message)
  return responses
    .filter(response => !response.toLowerCase().includes('error'))
    .reduce((longest, current) => 
      current.length > longest.length ? current : longest
    , responses[0] || '');
};