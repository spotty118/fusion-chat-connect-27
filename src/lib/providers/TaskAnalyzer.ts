import { ResponseType, TaskComplexity } from '@/types/ai';

export class TaskAnalyzer {
  private static readonly COMPLEXITY_INDICATORS: Record<TaskComplexity, string[]> = {
    simple: ['basic', 'simple', 'quick', 'short', 'straightforward'],
    moderate: ['detailed', 'thorough', 'complete', 'full'],
    complex: ['complex', 'advanced', 'sophisticated', 'comprehensive'],
    expert: ['expert', 'academic', 'research', 'scientific', 'professional'],
  };

  private static readonly FEATURE_KEYWORDS = {
    toolUse: ['analyze', 'process', 'compute', 'calculate'],
    codeInterpreter: ['execute', 'run', 'evaluate', 'test'],
    structuredOutput: ['format', 'json', 'xml', 'table'],
    retrieval: ['search', 'find', 'lookup', 'reference'],
    functionCalling: ['api', 'function', 'call', 'integrate'],
  };

  static analyzeTask(prompt: string, responseType: ResponseType) {
    const complexity = this.determineComplexity(prompt);
    const requiredFeatures = this.identifyRequiredFeatures(prompt);
    const estimatedTokens = this.estimateTokenCount(prompt);
    const priority = this.determinePriority(prompt, complexity);

    return {
      prompt,
      responseType,
      complexity,
      requiredFeatures,
      estimatedTokens,
      priority,
    };
  }

  private static determineComplexity(prompt: string): TaskComplexity {
    const promptLower = prompt.toLowerCase();
    
    for (const [complexityKey, indicators] of Object.entries(this.COMPLEXITY_INDICATORS)) {
      if (indicators.some((indicator) => promptLower.includes(indicator))) {
        return complexityKey as TaskComplexity;
      }
    }

    // Use more sophisticated analysis based on:
    // 1. Sentence structure complexity
    const sentenceCount = prompt.split(/[.!?]+/).length;
    const avgWordsPerSentence = prompt.split(' ').length / sentenceCount;

    // 2. Presence of technical terms
    const technicalTerms = /\b(algorithm|implementation|optimization|analysis|framework|architecture)\b/gi;
    const technicalTermCount = (prompt.match(technicalTerms) || []).length;

    // 3. Number of requirements/constraints
    const requirementIndicators = prompt.match(/\b(must|should|need|require|specify)\b/gi);
    const requirementCount = requirementIndicators ? requirementIndicators.length : 0;

    // Determine complexity based on combined factors
    if (avgWordsPerSentence > 20 || technicalTermCount > 3 || requirementCount > 3) {
      return 'complex';
    } else if (avgWordsPerSentence > 15 || technicalTermCount > 1 || requirementCount > 1) {
      return 'moderate';
    }

    return 'simple';
  }

  private static identifyRequiredFeatures(prompt: string) {
    const promptLower = prompt.toLowerCase();
    const requiredFeatures = [];

    for (const [feature, keywords] of Object.entries(this.FEATURE_KEYWORDS)) {
      if (keywords.some(keyword => promptLower.includes(keyword))) {
        requiredFeatures.push(feature);
      }
    }

    return requiredFeatures;
  }

  private static estimateTokenCount(prompt: string): number {
    const words = prompt.split(' ').length;
    return Math.ceil(words * 1.3);
  }

  private static determinePriority(prompt: string, complexity: TaskComplexity): 'speed' | 'quality' | 'balanced' {
    const speedIndicators = ['quick', 'fast', 'rapid', 'asap'];
    const qualityIndicators = ['accurate', 'precise', 'detailed', 'thorough'];

    const promptLower = prompt.toLowerCase();
    const hasSpeedIndicators = speedIndicators.some(indicator => promptLower.includes(indicator));
    const hasQualityIndicators = qualityIndicators.some(indicator => promptLower.includes(indicator));

    if (hasSpeedIndicators && !hasQualityIndicators) return 'speed';
    if (hasQualityIndicators || complexity === 'complex' || complexity === 'expert') return 'quality';
    return 'balanced';
  }
}
