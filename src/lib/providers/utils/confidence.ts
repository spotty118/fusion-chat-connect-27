import type { AIProvider } from '@/types/ai';
import type { TaskComplexity } from '@/types/ai';
import { TaskAnalyzer } from '../TaskAnalyzer';
import { PerformanceTracker } from '../PerformanceTracker';

export function calculateConfidence(
  provider: AIProvider,
  taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>
): number {
  let confidence = 0.5; // Base confidence

  // Adjust based on provider strength for this type of task
  confidence += ((provider.strengths[taskAnalysis.responseType] || 0) / 10) * 0.2;

  // Adjust based on historical performance
  const metrics = PerformanceTracker.getInstance().getProviderMetrics(provider.name);
  if (metrics) {
    confidence += metrics.successRate * 0.2;
    confidence -= metrics.errorRate * 0.1;
  }

  // Adjust based on task complexity
  const complexityPenalty = {
    simple: 0,
    moderate: -0.05,
    complex: -0.1,
    expert: -0.15,
  };
  confidence += complexityPenalty[taskAnalysis.complexity];

  // Boost confidence if provider specializes in this type of task
  if (
    provider.specialties.some((s) =>
      taskAnalysis.prompt.toLowerCase().includes(s.toLowerCase())
    )
  ) {
    confidence += 0.1;
  }

  // Cap confidence between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

export function generateDetailedExplanation(
  selectedProvider: AIProvider,
  taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
  rankedProviders: AIProvider[],
  confidence: number
): string {
  const metrics = PerformanceTracker.getInstance().getProviderMetrics(selectedProvider.name);
  const recentPerformance = PerformanceTracker.getInstance().getRecentPerformance(selectedProvider.name);

  let explanation = `Selected ${selectedProvider.name} for this ${taskAnalysis.complexity} ${taskAnalysis.responseType} task.\n\n`;

  explanation += 'Decision factors:\n';
  explanation += `- Task Complexity: ${taskAnalysis.complexity}\n`;
  explanation += `- Required Features: ${taskAnalysis.requiredFeatures.join(', ')}\n`;
  explanation += `- Estimated Tokens: ${taskAnalysis.estimatedTokens}\n`;
  explanation += `- Provider Strength: ${selectedProvider.strengths[taskAnalysis.responseType]}/10\n`;

  if (metrics) {
    explanation += `- Historical Success Rate: ${(metrics.successRate * 100).toFixed(1)}%\n`;
    explanation += `- Recent Performance: ${(recentPerformance * 100).toFixed(1)}%\n`;
    explanation += `- Avg Latency: ${metrics.averageLatency.toFixed(0)}ms\n`;
  }

  explanation += `\nConfidence: ${(confidence * 100).toFixed(1)}%\n`;

  if (rankedProviders.length > 1) {
    explanation += `\nAlternative providers considered: ${rankedProviders
      .slice(1, 3)
      .map((p) => p.name)
      .join(', ')}`;
  }

  return explanation;
}
