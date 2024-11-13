import { supabase } from "@/integrations/supabase/client";
import { FusionResponse } from './fusion-mode';

interface Agent {
  provider: string;
  model: string;
  role: string;
  instructions: string;
  endpoint: string;
  apiKey: string;
}

const AGENT_ROLES = {
  ANALYST: {
    role: 'analyst',
    instructions: 'You are an AI analyst. Analyze the problem and break it down into key components. Focus on understanding requirements and identifying potential challenges.'
  },
  IMPLEMENTER: {
    role: 'implementer',
    instructions: 'You are an AI implementer. Based on the analysis, provide concrete solutions or implementations. Be specific and practical.'
  },
  REVIEWER: {
    role: 'reviewer',
    instructions: 'You are an AI reviewer. Review the proposed implementation, identify potential issues, and suggest improvements. Consider edge cases and best practices.'
  },
  OPTIMIZER: {
    role: 'optimizer',
    instructions: 'You are an AI optimizer. Focus on optimizing the solution for efficiency, scalability, and performance. Suggest specific improvements and optimizations.'
  }
};

export const getAgentEndpoint = (provider: string): string => {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    case 'google':
      return 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export const generateMultiAgentResponse = async (
  message: string,
  apiKeys: Record<string, string>,
  selectedModels: Record<string, string>
): Promise<FusionResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    // Configure agents based on available providers
    const agents: Agent[] = Object.entries(apiKeys)
      .filter(([provider, key]) => key && selectedModels[provider])
      .map(([provider, apiKey], index) => {
        const roles = Object.values(AGENT_ROLES);
        const role = roles[index % roles.length];
        
        return {
          provider,
          model: selectedModels[provider],
          ...role,
          endpoint: getAgentEndpoint(provider),
          apiKey
        };
      });

    if (agents.length < 3) {
      throw new Error('Multi-agent mode requires at least 3 configured providers');
    }

    const { data, error } = await supabase.functions.invoke('multi-agent', {
      body: { message, agents },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) throw error;

    // Validate the response format
    if (!data?.response || typeof data.response !== 'object' || !('final' in data.response) || !('providers' in data.response)) {
      throw new Error('Invalid response format from edge function');
    }

    return data.response as FusionResponse;

  } catch (error) {
    console.error('Error in multi-agent response:', error);
    throw error;
  }
};