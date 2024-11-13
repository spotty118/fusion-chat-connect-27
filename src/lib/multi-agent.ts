import { supabase } from "@/integrations/supabase/client";
import { Database } from 'lucide-react';

const AGENT_ROLES = {
  RESEARCHER: {
    role: 'researcher',
    instructions: 'You are an AI researcher. Your role is to analyze the query deeply, break down complex problems, and identify key areas that need investigation. Focus on understanding the core requirements and potential challenges.'
  },
  CRITIC: {
    role: 'critic',
    instructions: 'You are an AI critic. Your role is to evaluate proposed solutions critically, identify potential issues, and suggest improvements. Consider edge cases, limitations, and potential problems.'
  },
  IMPLEMENTER: {
    role: 'implementer',
    instructions: 'You are an AI implementer. Based on the research and critique, provide concrete, practical solutions. Focus on actionable steps and specific implementations.'
  },
  SYNTHESIZER: {
    role: 'synthesizer',
    instructions: 'You are an AI synthesizer. Your role is to combine insights from all agents into a coherent, unified response. Focus on creating a clear, well-structured answer that incorporates the best elements from each perspective.'
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

    // Configure agents with specific roles
    const agents = Object.entries(apiKeys)
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

    // Sequential collaboration process
    const { data, error } = await supabase.functions.invoke('multi-agent', {
      body: { 
        message,
        agents,
        collaborationSteps: [
          { type: 'research', description: 'Initial analysis and research' },
          { type: 'critique', description: 'Critical evaluation of initial findings' },
          { type: 'implement', description: 'Implementation suggestions based on research and critique' },
          { type: 'synthesize', description: 'Final synthesis of all perspectives' }
        ]
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) throw error;

    if (!data?.response || typeof data.response !== 'object' || !('final' in data.response) || !('providers' in data.response)) {
      throw new Error('Invalid response format from edge function');
    }

    return data.response as FusionResponse;

  } catch (error) {
    console.error('Error in multi-agent response:', error);
    throw error;
  }
};