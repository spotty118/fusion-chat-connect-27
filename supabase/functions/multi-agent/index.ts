import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Types
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

// Constants
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function makeProviderRequest(agent: Agent, message: string): Promise<string> {
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
            { role: 'user', content: message }
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
            { role: 'user', content: message }
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
              text: `${agent.instructions}\n\n${message}`
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

function combineResponses(responses: Array<{ provider: string; role: string; response: string }>): string {
  // Create a structured summary of all responses
  const summary = responses.map(r => {
    return `${r.role.toUpperCase()} (${r.provider}): ${r.response}`;
  }).join('\n\n');

  return `Based on multiple AI perspectives:\n\n${summary}`;
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

    const providerResponses = await Promise.all(
      agents.map(async (agent: Agent) => {
        const response = await makeProviderRequest(agent, message);
        return {
          provider: agent.provider,
          role: agent.role,
          response: response
        };
      })
    );

    const fusionResponse: FusionResponse = {
      final: combineResponses(providerResponses),
      providers: providerResponses
    };

    console.log('Successfully generated fusion response:', fusionResponse);

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