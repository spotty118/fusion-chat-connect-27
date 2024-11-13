import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeProviderRequest } from './utils.ts';
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
    const { message, agents, collaborationSteps } = await req.json();
    console.log('Starting collaborative multi-agent process');

    let currentContext = message;
    const agentResponses = [];

    // Sequential collaboration through defined steps
    for (const step of collaborationSteps) {
      const relevantAgent = agents.find(a => a.role.toLowerCase().includes(step.type));
      if (!relevantAgent) continue;

      console.log(`Executing ${step.type} step with ${relevantAgent.provider}`);

      const stepPrompt = `
Context: ${currentContext}

Your Role: ${relevantAgent.instructions}

Current Step: ${step.description}

Previous Insights: ${agentResponses.map(r => `
${r.role.toUpperCase()}: ${r.response}`).join('\n')}

Task: Based on the above context and previous insights, provide your perspective and contribution.
`;

      const response = await makeProviderRequest(relevantAgent, stepPrompt);
      agentResponses.push({
        provider: relevantAgent.provider,
        role: relevantAgent.role,
        response: response
      });

      // Update context with new insights
      currentContext = `${currentContext}\n\nInsights from ${relevantAgent.role}: ${response}`;
    }

    // Final synthesis
    const synthesizer = agents.find(a => a.role.toLowerCase().includes('synthesizer'));
    const finalResponse = synthesizer ? await makeProviderRequest(synthesizer, `
Create a final, coherent response that synthesizes all these perspectives:

${agentResponses.map(r => `${r.role.toUpperCase()}: ${r.response}`).join('\n\n')}

Important: Provide a clear, well-structured final response that incorporates the best insights from each perspective.
    `) : agentResponses[agentResponses.length - 1].response;

    const fusionResponse: FusionResponse = {
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