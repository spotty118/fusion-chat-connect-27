import { PROVIDER_KEYWORD_STRENGTHS, BASE_STRENGTHS } from './provider-strengths.ts';

export function calculateProviderStrength(
  provider: string,
  category: string,
  prompt: string
): number {
  const baseStrength = BASE_STRENGTHS[provider]?.[category] || 0.7;
  const keywords = PROVIDER_KEYWORD_STRENGTHS[provider]?.[category] || [];
  
  const lowercasePrompt = prompt.toLowerCase();
  const matchedKeywords = keywords.filter(keyword => 
    lowercasePrompt.includes(keyword.toLowerCase())
  );
  
  const keywordBoost = (matchedKeywords.length / keywords.length) * 0.2;
  
  console.log(`Provider ${provider} for ${category}:`, {
    baseStrength,
    matchedKeywords: matchedKeywords.join(', '),
    keywordBoost,
    finalStrength: Math.min(baseStrength + keywordBoost, 1)
  });

  return Math.min(baseStrength + keywordBoost, 1);
}

export function getBestProviderForCategory(
  category: string,
  availableProviders: string[],
  prompt: string
): string {
  let bestProvider = availableProviders[0];
  let maxStrength = 0;

  availableProviders.forEach(provider => {
    const strength = calculateProviderStrength(provider, category, prompt);
    console.log(`Provider ${provider} strength for ${category}: ${strength}`);
    
    if (strength > maxStrength) {
      maxStrength = strength;
      bestProvider = provider;
    }
  });

  console.log(`Selected ${bestProvider} as best provider for ${category} with strength ${maxStrength}`);
  return bestProvider;
}