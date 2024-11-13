import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeProviderRequest, conductVotingRound } from './utils.ts';
import type { Agent, FusionResponse } from './types.ts';

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
    console.log('Processing multi-agent request:', { message, agentCount: agents.length });

    if (!agents || agents.length < 2) {
      throw new Error('At least 2 agents are required');
    }

    // Step 1: Get initial responses from all agents
    console.log('Getting initial responses from agents...');
    const initialResponses = await Promise.all(
      agents.map(async (agent: Agent) => {
        const response = await makeProviderRequest(agent, message);
        return {
          provider: agent.provider,
          role: agent.role,
          response: response
        };
      })
    );

    // Step 2: Conduct voting and create final synthesis
    console.log('Starting voting and synthesis process...');
    const finalResponse = await conductVotingRound(agents, initialResponses);

    const fusionResponse: FusionResponse = {
      final: finalResponse,
      providers: initialResponses
    };

    console.log('Successfully generated fusion response');

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