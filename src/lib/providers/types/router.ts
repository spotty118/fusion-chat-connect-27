import type { ResponseType } from '@/components/ResponseTypeSelector';

export interface RouterRequestOptions {
  responseType: ResponseType;
  message: string;
  maxLatency?: number;
  minReliability?: number;
  preferredProvider?: string;
  availableProviders?: string[]; // Add this field
}

export interface RouterResponse {
  provider: string;
  response: any;
  explanation: string;
  confidence: number;
}