import { PromptCategory, PromptAnalysis } from './types.ts';

const CATEGORY_KEYWORDS = {
  creative: ['write', 'story', 'creative', 'imagine', 'design'],
  technical: ['explain', 'how', 'what', 'why', 'technical'],
  code: ['code', 'function', 'programming', 'debug', 'implement'],
  general: ['help', 'can', 'would', 'should', 'opinion']
};

export const analyzePrompt = (prompt: string): PromptAnalysis => {
  const lowercasePrompt = prompt.toLowerCase();
  
  // Simple keyword-based classification
  let maxCategory: PromptCategory = 'general';
  let maxCount = 0;
  
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    const count = keywords.reduce((acc, keyword) => 
      acc + (lowercasePrompt.includes(keyword) ? 1 : 0), 0
    );
    if (count > maxCount) {
      maxCount = count;
      maxCategory = category as PromptCategory;
    }
  });

  // Simple topic extraction using keyword frequency
  const words = lowercasePrompt.split(/\W+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3) { // Skip short words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const topics = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  return {
    category: maxCategory,
    confidence: Math.min(maxCount / 3, 1), // Normalize confidence
    sentiment: 0.5, // Neutral default
    topics
  };
};

export const getBestProviderForCategory = (
  category: PromptCategory,
  availableProviders: string[]
): string => {
  // Provider strengths based on categories
  const providerStrengths: Record<string, Record<PromptCategory, number>> = {
    openai: { creative: 0.8, technical: 0.9, code: 0.9, general: 0.8 },
    claude: { creative: 0.9, technical: 0.8, code: 0.8, general: 0.9 },
    google: { creative: 0.7, technical: 0.9, code: 0.8, general: 0.8 },
    openrouter: { creative: 0.8, technical: 0.8, code: 0.7, general: 0.9 }
  };

  let bestProvider = availableProviders[0];
  let maxStrength = 0;

  availableProviders.forEach(provider => {
    const strength = providerStrengths[provider]?.[category] || 0;
    if (strength > maxStrength) {
      maxStrength = strength;
      bestProvider = provider;
    }
  });

  return bestProvider;
};