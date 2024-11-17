import { AIProvider, TaskComplexity, ResponseType } from '@/types/ai';
import { TaskAnalyzer } from './TaskAnalyzer';
import { PerformanceTracker } from './PerformanceTracker';
import { providers } from './config';
import { makeProviderRequest } from '@/lib/provider-api';

export class IntelligentAIRouter {
  private providers: AIProvider[];
  private performanceTracker: PerformanceTracker;

  constructor() {
    this.providers = providers;
    this.performanceTracker = PerformanceTracker.getInstance();
  }

  async routeRequest({
    responseType,
    message,
    maxLatency,
    minReliability
  }: {
    responseType: ResponseType;
    message: string;
    maxLatency?: number;
    minReliability?: number;
  }) {
    console.log('Routing request:', { responseType, message, maxLatency, minReliability });
    
    const taskAnalysis = TaskAnalyzer.analyzeTask(message, responseType);
    console.log('Task analysis:', taskAnalysis);

    const rankedProviders = this.rankProviders(responseType, taskAnalysis, {
      maxLatency,
      minReliability
    });

    if (rankedProviders.length === 0) {
      throw new Error('No suitable provider found for the given task and constraints');
    }

    const selectedProvider = rankedProviders[0];
    const confidence = this.calculateConfidence(selectedProvider, taskAnalysis);
    console.log('Selected provider:', selectedProvider.name, 'with confidence:', confidence);

    try {
      const startTime = Date.now();
      const response = await makeProviderRequest(
        selectedProvider.name.toLowerCase(),
        message,
        localStorage.getItem(`${selectedProvider.name.toLowerCase()}_model`) || ''
      );
      const latency = Date.now() - startTime;

      this.performanceTracker.updateMetrics(selectedProvider.name, {
        success: true,
        latency,
        cost: this.estimateCost(selectedProvider, taskAnalysis.estimatedTokens),
        satisfactionScore: 1,
      });

      return {
        provider: selectedProvider.name,
        response,
        explanation: this.generateDetailedExplanation(selectedProvider, taskAnalysis, rankedProviders, confidence),
        confidence,
      };
    } catch (error) {
      console.error('Provider request failed:', error);
      
      this.performanceTracker.updateMetrics(selectedProvider.name, {
        success: false,
        latency: 0,
        cost: 0,
        satisfactionScore: 0,
      });

      if (rankedProviders.length > 1) {
        console.log('Trying next best provider...');
        return this.routeRequest({
          responseType,
          message,
          maxLatency,
          minReliability,
          preferredProvider: rankedProviders[1].name,
        });
      }
      throw error;
    }
  }

  private rankProviders(
    responseType: ResponseType,
    taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
    userPreferences: any
  ): AIProvider[] {
    const suitableProviders = this.providers.filter((provider) =>
      this.isProviderSuitable(provider, responseType, taskAnalysis, userPreferences)
    );

    return suitableProviders
      .map((provider) => ({
        provider,
        score: this.calculateProviderScore(provider, taskAnalysis, userPreferences),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.provider);
  }

  private isProviderSuitable(
    provider: AIProvider,
    responseType: ResponseType,
    taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
    userPreferences: any
  ): boolean {
    // Check basic capability
    if (!provider.capabilities.includes(responseType)) return false;

    // Check required features
    if (!taskAnalysis.requiredFeatures.every((feature) => provider.features[feature])) return false;

    // Check context window
    if (taskAnalysis.estimatedTokens > provider.contextWindow) return false;

    // Check user constraints
    if (userPreferences.maxCost && provider.costPerToken > userPreferences.maxCost) return false;
    if (userPreferences.maxLatency && provider.averageLatency > userPreferences.maxLatency) return false;
    if (userPreferences.minReliability) {
      const metrics = this.performanceTracker.getProviderMetrics(provider.name);
      const successRate = metrics ? metrics.successRate : 1;
      if (successRate < userPreferences.minReliability) return false;
    }

    // All checks passed
    return true;
  }

  private calculateProviderScore(
    provider: AIProvider,
    taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
    userPreferences: any
  ): number {
    let score = 0;

    // Base capability score (0-10)
    score += provider.strengths[taskAnalysis.responseType] || 0;

    // Historical performance adjustment
    const metrics = this.performanceTracker.getProviderMetrics(provider.name);
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

    // Recent performance adjustment
    const recentPerformance = this.performanceTracker.getRecentPerformance(provider.name);
    score *= 0.7 + recentPerformance * 0.3; // Max 30% impact

    // Cost efficiency adjustment if cost-sensitive
    if (userPreferences.maxCost) {
      const costEfficiencyScore = 1 - provider.costPerToken / userPreferences.maxCost;
      score *= 0.8 + costEfficiencyScore * 0.2; // Max 20% impact
    }

    return score;
  }

  private calculateConfidence(
    provider: AIProvider,
    taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>
  ): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on provider strength for this type of task
    confidence += ((provider.strengths[taskAnalysis.responseType] || 0) / 10) * 0.2;

    // Adjust based on historical performance
    const metrics = this.performanceTracker.getProviderMetrics(provider.name);
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

  private generateDetailedExplanation(
    selectedProvider: AIProvider,
    taskAnalysis: ReturnType<typeof TaskAnalyzer.analyzeTask>,
    rankedProviders: AIProvider[],
    confidence: number
  ): string {
    const metrics = this.performanceTracker.getProviderMetrics(selectedProvider.name);
    const recentPerformance = this.performanceTracker.getRecentPerformance(selectedProvider.name);

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

  private estimateCost(provider: AIProvider, tokenCount: number): number {
    return provider.costPerToken * tokenCount;
  }
}

export const intelligentRouter = new IntelligentAIRouter();
