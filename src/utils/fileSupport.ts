export const supportsFileAttachments = (provider: string, model: string): boolean => {
  switch (provider) {
    case 'openai':
      // Only GPT-4 Vision models support files
      return model.includes('vision');
    case 'claude':
      // Claude 3 models support files
      return model.includes('claude-3');
    default:
      return false;
  }
};