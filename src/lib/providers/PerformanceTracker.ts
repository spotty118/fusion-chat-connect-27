import { PerformanceMetrics } from '@/types/ai';

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, PerformanceMetrics>;
  private history: Array<{
    provider: string;
    task: string;
    success: boolean;
    latency: number;
    timestamp: Date;
  }>;

  private constructor() {
    this.metrics = new Map();
    this.history = [];
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  updateMetrics(provider: string, result: {
    success: boolean;
    latency: number;
    cost: number;
    satisfactionScore: number;
  }): void {
    const current = this.metrics.get(provider) || {
      successRate: 1,
      averageLatency: result.latency,
      errorRate: 0,
      userSatisfactionScore: result.satisfactionScore,
      costEfficiency: 1,
    };

    const alpha = 0.1;
    this.metrics.set(provider, {
      successRate: (1 - alpha) * current.successRate + alpha * (result.success ? 1 : 0),
      averageLatency: (1 - alpha) * current.averageLatency + alpha * result.latency,
      errorRate: (1 - alpha) * current.errorRate + alpha * (result.success ? 0 : 1),
      userSatisfactionScore: (1 - alpha) * current.userSatisfactionScore + alpha * result.satisfactionScore,
      costEfficiency: (1 - alpha) * current.costEfficiency + alpha * (result.cost > 0 ? 1 / result.cost : 0),
    });

    this.history.push({
      provider,
      task: 'task_id',
      success: result.success,
      latency: result.latency,
      timestamp: new Date(),
    });
  }

  getProviderMetrics(provider: string): PerformanceMetrics | undefined {
    return this.metrics.get(provider);
  }

  getRecentPerformance(provider: string, minutes: number = 60): number {
    const recentHistory = this.history.filter(
      record => record.provider === provider && 
      record.timestamp > new Date(Date.now() - minutes * 60000)
    );

    if (recentHistory.length === 0) return 1;

    return recentHistory.reduce((acc, record) => acc + (record.success ? 1 : 0), 0) / recentHistory.length;
  }
}