export type ResponseType = 
  | 'general'
  | 'coding'
  | 'creative'
  | 'data'
  | 'technical';

export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'expert';

export interface AIProvider {
  name: string;
  capabilities: ResponseType[];
  apiEndpoint: string;
  apiKey?: string;
  strengths: Partial<Record<ResponseType, number>>;
  costPerToken: number;
  averageLatency: number;
  contextWindow: number;
  specialties: string[];
  features: {
    toolUse: boolean;
    codeInterpreter: boolean;
    structuredOutput: boolean;
    retrieval: boolean;
    functionCalling: boolean;
  };
  limitations: string[];
}

export interface PerformanceMetrics {
  successRate: number;
  averageLatency: number;
  errorRate: number;
  userSatisfactionScore: number;
  costEfficiency: number;
}