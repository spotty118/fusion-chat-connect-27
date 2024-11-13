import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface Agent {
  provider: string;
  model: string;
  role: string;
  instructions: string;
  endpoint: string;
  apiKey: string;
}

interface FusionResponse {
  final: string;
  providers: Array<{
    provider: string;
    role: string;
    response: string;
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function makeProviderRequest(agent: Agent, prompt: string): Promise<string> {
  try {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: Record<string, any>;

    switch (agent.provider) {
      case 'openai':
      case 'openrouter':
        headers['Authorization'] = `Bearer ${agent.apiKey}`;
        if (agent.provider === 'openrouter') {
          headers['HTTP-Referer'] = Deno.env.get('APP_URL') ?? '*';
        }
        body = {
          model: agent.model,
          messages: [
            { role: 'system', content: agent.instructions },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        };
        break;

      case 'claude':
        headers['x-api-key'] = agent.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: agent.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: agent.instructions,
          max_tokens: 1000
        };
        break;

      case 'google':
        body = {
          contents: [{
            role: "user",
            parts: [{
              text: `${agent.instructions}\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${agent.provider}`);
    }

    const endpoint = agent.provider === 'google' 
      ? `${agent.endpoint}?key=${agent.apiKey}`
      : agent.endpoint;

    console.log(`Making request to ${agent.provider}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`${agent.provider} API error:`, error);
      throw new Error(`${agent.provider} API error: ${error}`);
    }

    const data = await response.json();
    console.log(`${agent.provider} API response received`);

    switch (agent.provider) {
      case 'openai':
      case 'openrouter':
        return data.choices[0].message.content;
      case 'claude':
        return data.content[0].text;
      case 'google':
        return data.candidates[0].content.parts[0].text;
      default:
        throw new Error(`Unsupported provider: ${agent.provider}`);
    }
  } catch (error) {
    console.error(`Error with ${agent.provider}:`, error);
    throw error;
  }
}

async function conductVotingRound(agents: Agent[], initialResponses: Array<{ provider: string; role: string; response: string }>): Promise<string> {
  const votingPrompt = `As AI models collaborating on a task, let's analyze and vote on the best elements from each response to create a unified output. Here are the initial responses:

${initialResponses.map(r => `${r.role.toUpperCase()} (${r.provider}):
${r.response}`).join('\n\n')}

Please:
1. Identify the strongest points and insights from each response
2. Vote on which elements should be included in the final response
3. Point out any contradictions or inconsistencies that need to be resolved
4. Suggest how to combine the best elements into a cohesive response

Format your response as a structured analysis with clear recommendations for the final unified response.`;

  // Use each agent to vote and provide recommendations
  const votingResponses = await Promise.all(
    agents.map(agent => makeProviderRequest(agent, votingPrompt))
  );

  // Create a synthesis prompt based on the voting results
  const synthesisPrompt = `Based on the voting results from all agents:

${votingResponses.join('\n\n')}

Please create a final, unified response that:
1. Incorporates the most voted-for elements and insights
2. Resolves any identified contradictions
3. Maintains a clear and coherent flow
4. Presents a balanced perspective from all agents

The response should be well-structured and ready for presentation to the user.`;

  // Use the first agent (typically the most capable) to create the final synthesis
  const synthesizer = agents[0];
  console.log('Creating final synthesis using:', synthesizer.provider);
  return await makeProviderRequest(synthesizer, synthesisPrompt);
}

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