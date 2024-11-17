import type { AIProvider, ResponseType, TaskComplexity } from '@/types/ai';
import { PerformanceTracker } from '../PerformanceTracker';
import { TaskAnalyzer } from '../TaskAnalyzer';

export function rankProviders(
  providers: AIProvider[],
  responseType: ResponseType,
  taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
  userPreferences: any
): AIProvider[] {
  const suitableProviders = providers.filter((provider) =>
    isProviderSuitable(provider, responseType, taskAnalysis, userPreferences)
  );

  return suitableProviders
    .map((provider) => ({
      provider,
      score: calculateProviderScore(provider, taskAnalysis, userPreferences),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.provider);
}

function isProviderSuitable(
  provider: AIProvider,
  responseType: ResponseType,
  taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
  userPreferences: any
): boolean {
  if (!provider.capabilities.includes(responseType)) return false;
  if (!taskAnalysis.requiredFeatures.every((feature) => provider.features[feature])) return false;
  if (taskAnalysis.estimatedTokens > provider.contextWindow) return false;
  if (userPreferences.maxCost && provider.costPerToken > userPreferences.maxCost) return false;
  if (userPreferences.maxLatency && provider.averageLatency > userPreferences.maxLatency) return false;
  if (userPreferences.minReliability) {
    const metrics = PerformanceTracker.getInstance().getProviderMetrics(provider.name);
    const successRate = metrics ? metrics.successRate : 1;
    if (successRate < userPreferences.minReliability) return false;
  }
  return true;
}

function calculateProviderScore(
  provider: AIProvider,
  taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
  userPreferences: any
): number {
  let score = 0;

  // Base capability score (0-10)
  score += provider.strengths[taskAnalysis.responseType] || 0;

  // Historical performance adjustment
  const metrics = PerformanceTracker.getInstance().getProviderMetrics(provider.name);
  if (metrics) {
    score *=
      metrics.successRate * 0.3 + // 30% weight for success rate
      (1 / (metrics.averageLatency / 1000)) * 0.2 + // 20% weight for speed
      metrics.userSatisfactionScore * 0.3 + // 30% weight for user satisfaction
      metrics.costEfficiency * 0.2; // 20% weight for cost efficiency
  }

  // Complexity alignment
  const complexityScores: Record<TaskComplexity, Record<'fast' | 'balanced' | 'slow', number>> = {
    simple: { fast: 1.2, balanced: 1.0, slow: 0.8 },
    moderate: { fast: 0.9, balanced: 1.2, slow: 1.0 },
    complex: { fast: 0.7, balanced: 1.0, slow: 1.2 },
    expert: { fast: 0.6, balanced: 0.9, slow: 1.3 },
  };

  const speedCategory =
    provider.averageLatency < 1500 ? 'fast' : provider.averageLatency > 2500 ? 'slow' : 'balanced';

  score *= complexityScores[taskAnalysis.complexity][speedCategory];

  // Feature availability bonus
  const requiredFeatures = taskAnalysis.requiredFeatures;
  const featureAvailabilityScore =
    requiredFeatures.reduce((acc, feature) => acc + (provider.features[feature] ? 1 : 0), 0) /
    requiredFeatures.length;
  score *= 0.5 + featureAvailabilityScore * 0.5; // Max 50% impact

  // Specialization bonus
  const isSpecialist = provider.specialties.some((specialty) =>
    taskAnalysis.prompt.toLowerCase().includes(specialty.toLowerCase())
  );
  if (isSpecialist) score *= 1.2;

  return score;
}
