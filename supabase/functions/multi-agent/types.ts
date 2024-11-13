export interface Agent {
  provider: string;
  model: string;
  role: string;
  instructions: string;
  endpoint: string;
  apiKey: string;
}

export interface AgentResponse {
  provider: string;
  role: string;
  response: string;
}

export interface FusionResponse {
  final: string;
  providers: AgentResponse[];
}