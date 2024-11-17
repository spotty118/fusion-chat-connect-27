import { PromptAnalysis, PromptCategory } from './types.ts';

export function analyzePrompt(prompt: string): PromptAnalysis {
  // Simple analysis based on keywords
  const lowerPrompt = prompt.toLowerCase();
  
  // Define keyword sets for different categories
  const codeKeywords = ['code', 'function', 'programming', 'debug', 'error', 'syntax'];
  const technicalKeywords = ['technical', 'system', 'architecture', 'design', 'implement'];
  const creativeKeywords = ['creative', 'story', 'write', 'design', 'imagine'];

  // Count matches for each category
  const codeMatches = codeKeywords.filter(kw => lowerPrompt.includes(kw)).length;
  const technicalMatches = technicalKeywords.filter(kw => lowerPrompt.includes(kw)).length;
  const creativeMatches = creativeKeywords.filter(kw => lowerPrompt.includes(kw)).length;

  // Determine category based on keyword matches
  let category: PromptCategory = 'general';
  let confidence = 0.5;

  if (codeMatches > technicalMatches && codeMatches > creativeMatches) {
    category = 'code';
    confidence = 0.7 + (codeMatches * 0.1);
  } else if (technicalMatches > creativeMatches) {
    category = 'technical';
    confidence = 0.7 + (technicalMatches * 0.1);
  } else if (creativeMatches > 0) {
    category = 'creative';
    confidence = 0.7 + (creativeMatches * 0.1);
  }

  // Extract potential topics (simple implementation)
  const words = prompt.split(/\s+/);
  const topics = words
    .filter(word => word.length > 4)
    .filter(word => !['what', 'when', 'where', 'which', 'while', 'would'].includes(word.toLowerCase()))
    .slice(0, 3);

  // Simple sentiment analysis (very basic implementation)
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best'];
  const negativeWords = ['bad', 'wrong', 'error', 'issue', 'problem', 'worst'];
  
  const positiveCount = positiveWords.filter(word => lowerPrompt.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerPrompt.includes(word)).length;
  
  const sentiment = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);

  return {
    category,
    confidence: Math.min(confidence, 1),
    sentiment,
    topics
  };
}