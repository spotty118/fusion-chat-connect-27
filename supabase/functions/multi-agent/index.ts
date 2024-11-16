import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeProviderRequest, conductVotingRound } from './utils.ts';
import type { Agent, AgentResponse } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agents } = await req.json();
    console.log('Starting collaborative multi-agent process');
    console.log('Active agents:', agents.map((a: Agent) => `${a.provider} (${a.role})`));

    const agentResponses: AgentResponse[] = [];

    // Analyze the prompt to understand context and requirements
    const analysis = analyzePrompt(message);
    console.log('Prompt analysis:', analysis);

    // Sort agents by their suitability for the prompt category
    const sortedAgents = [...agents].sort((a, b) => {
      const aStrength = getProviderStrength(a.provider, analysis.category);
      const bStrength = getProviderStrength(b.provider, analysis.category);
      return bStrength - aStrength;
    });

    // Get responses from each agent
    for (const agent of sortedAgents) {
      console.log(`Getting response from ${agent.provider} as ${agent.role}`);
      try {
        const response = await makeProviderRequest(agent, message);
        agentResponses.push({
          provider: agent.provider,
          role: agent.role,
          response: response
        });
      } catch (error) {
        console.error(`Error with ${agent.provider}:`, error);
        // Continue with other agents if one fails
      }
    }

    if (agentResponses.length === 0) {
      throw new Error('No agents were able to provide responses');
    }

    // Conduct final synthesis with enhanced context awareness
    console.log('Starting final synthesis phase');
    const finalResponse = await conductVotingRound(agents, agentResponses, message);

    const fusionResponse = {
      final: finalResponse,
      providers: agentResponses,
      analysis: {
        category: analysis.category,
        topics: analysis.topics,
        confidence: analysis.confidence
      }
    };

    return new Response(
      JSON.stringify({ response: fusionResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in multi-agent function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getProviderStrength(provider: string, category: string): number {
  const strengths: Record<string, Record<string, number>> = {
    openai: { creative: 0.8, technical: 0.9, code: 0.9, general: 0.8 },
    claude: { creative: 0.9, technical: 0.8, code: 0.8, general: 0.9 },
    google: { creative: 0.7, technical: 0.9, code: 0.8, general: 0.8 },
    openrouter: { creative: 0.8, technical: 0.8, code: 0.7, general: 0.9 }
  };
  
  return strengths[provider]?.[category] || 0.5;
}