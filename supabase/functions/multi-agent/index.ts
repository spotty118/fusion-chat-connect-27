import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeProviderRequest, conductVotingRound } from './utils.ts';
import { analyzePrompt } from './prompt-analysis.ts';
import { Agent, AgentResponse } from './types.ts';

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
    console.log('Starting collaborative multi-agent process with message:', message);
    console.log('Active agents:', agents.map((a: Agent) => `${a.provider} (${a.role})`));

    const agentResponses: AgentResponse[] = [];

    // Analyze the prompt to understand context and requirements
    const analysis = analyzePrompt(message);
    console.log('Prompt analysis:', analysis);

    // Get responses from each agent
    for (const agent of agents) {
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