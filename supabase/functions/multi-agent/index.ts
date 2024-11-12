import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, AGENT_ROLES } from './constants.ts';
import { getAgentEndpoint, selectBestResponse } from './utils.ts';
import { Agent, AgentResponse } from './types.ts';

async function makeProviderRequest(agent: Agent, message: string): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let body;
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
            { role: 'user', content: message }
          ]
        };
        break;

      case 'claude':
        headers['x-api-key'] = agent.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: agent.model,
          system: agent.instructions,
          messages: [{ role: 'user', content: message }]
        };
        break;

      case 'google':
        body = {
          contents: [{
            role: "user",
            parts: [{ text: `${agent.instructions}\n\n${message}` }]
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`${agent.provider} API error: ${await response.text()}`);
    }

    const data = await response.json();
    
    switch (agent.provider) {
      case 'openai':
      case 'openrouter':
        return data.choices[0].message.content;
      case 'claude':
        return data.content[0].text;
      case 'google':
        return data.candidates[0].content.parts[0].text;
      default:
        return '';
    }
  } catch (error) {
    console.error(`Error with ${agent.provider}:`, error);
    return `Error: ${error.message}`;
  }
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

    // Get responses from all agents
    const responses = await Promise.all(
      agents.map(async (agent: Agent) => {
        const response = await makeProviderRequest(agent, message);
        return response;
      })
    );

    // Select the best response
    const finalResponse = selectBestResponse(responses);

    return new Response(
      JSON.stringify({ response: finalResponse }),
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