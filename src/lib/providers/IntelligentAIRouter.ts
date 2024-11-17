import { AIProvider } from '@/types/ai';
import { TaskAnalyzer } from './TaskAnalyzer';
import { PerformanceTracker } from './PerformanceTracker';
import { rankProviders } from './utils/provider-selection';
import { calculateConfidence, generateDetailedExplanation } from './utils/confidence';
import type { RouterRequestOptions, RouterResponse } from './types/router';

export class IntelligentAIRouter {
  private providers: AIProvider[];
  private performanceTracker: PerformanceTracker;

  constructor() {
    this.providers = [];
    this.performanceTracker = PerformanceTracker.getInstance();
  }

  async routeRequest(options: RouterRequestOptions): Promise<RouterResponse> {
    console.log('Routing request:', options);
    
    const taskAnalysis = TaskAnalyzer.analyzeTask(options.message, options.responseType);
    console.log('Task analysis:', taskAnalysis);

    // Only consider providers that are:
    // 1. In the availableProviders list
    // 2. Have their localStorage enabled flag set to true
    const availableProviders = this.providers.filter(p => {
      const isEnabled = localStorage.getItem(`${p.name.toLowerCase()}_enabled`) === 'true';
      const isInList = options.availableProviders?.includes(p.name.toLowerCase());
      console.log(`Provider ${p.name} status:`, { isEnabled, isInList });
      return isEnabled && isInList;
    });

    console.log('Available providers after filtering:', availableProviders.map(p => p.name));

    if (availableProviders.length === 0) {
      throw new Error('No suitable provider found for the given task and constraints');
    }

    const rankedProviders = rankProviders(
      availableProviders,
      options.responseType,
      taskAnalysis,
      {
        maxLatency: options.maxLatency,
        minReliability: options.minReliability,
        preferredProvider: options.preferredProvider
      }
    );

    if (rankedProviders.length === 0) {
      throw new Error('No suitable provider found for the given task and constraints');
    }

    const selectedProvider = rankedProviders[0];
    const confidence = calculateConfidence(selectedProvider, taskAnalysis);
    console.log('Selected provider:', selectedProvider.name, 'with confidence:', confidence);

    try {
      const startTime = Date.now();
      const response = await this.makeProviderRequest(selectedProvider, options.message);
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
        explanation: generateDetailedExplanation(selectedProvider, taskAnalysis, rankedProviders, confidence),
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
          ...options,
          preferredProvider: rankedProviders[1].name,
        });
      }
      throw error;
    }
  }

  private estimateCost(provider: AIProvider, tokenCount: number): number {
    return provider.costPerToken * tokenCount;
  }

  private async makeProviderRequest(provider: AIProvider, message: string): Promise<any> {
    // Implementation of actual provider API calls
    return Promise.resolve({
      status: 'success',
      result: `Response from ${provider.name} for message: ${message}`,
    });
  }
}

export const intelligentRouter = new IntelligentAIRouter();