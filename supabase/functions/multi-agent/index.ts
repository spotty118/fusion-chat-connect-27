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
    const { message, agents, collaborationSteps } = await req.json();
    console.log('Starting collaborative multi-agent process');
    console.log('Active agents:', agents.map((a: Agent) => `${a.provider} (${a.role})`));

    let currentContext = message;
    const agentResponses: AgentResponse[] = [];

    // Sequential collaboration through defined steps
    for (const step of collaborationSteps) {
      const relevantAgent = agents.find((a: Agent) => a.role.toLowerCase().includes(step.type));
      if (!relevantAgent) continue;

      console.log(`Executing ${step.type} step with ${relevantAgent.provider}`);

      const response = await makeProviderRequest(relevantAgent, currentContext);
      agentResponses.push({
        provider: relevantAgent.provider,
        role: relevantAgent.role,
        response: response
      });

      // Update context with new insights
      currentContext = `Original query: ${message}\n\nCurrent insights:\n${agentResponses.map(r => 
        `${r.role.toUpperCase()} (${r.provider}):\n${r.response}`
      ).join('\n\n')}`;
    }

    // Conduct final synthesis through voting
    console.log('Starting final synthesis phase');
    const finalResponse = await conductVotingRound(agents, agentResponses);

    const fusionResponse = {
      final: finalResponse,
      providers: agentResponses
    };

    console.log('Successfully completed multi-agent collaboration');

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