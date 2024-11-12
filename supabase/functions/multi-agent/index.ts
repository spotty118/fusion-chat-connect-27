import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Agent {
  provider: string;
  model: string;
  role: string;
  instructions: string;
  endpoint: string;
  apiKey: string;
}

async function makeProviderRequest(agent: Agent, message: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let body;

  switch (agent.provider) {
    case 'openai':
      headers['Authorization'] = `Bearer ${agent.apiKey}`;
      body = {
        model: agent.model,
        messages: [
          { role: 'system', content: agent.instructions },
          { role: 'user', content: message }
        ]
      };
      break;

    case 'openrouter':
      headers['Authorization'] = `Bearer ${agent.apiKey}`;
      headers['HTTP-Referer'] = 'http://localhost:3000'; // Replace with your actual domain
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
          parts: [{
            text: `${agent.instructions}\n\n${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      };
      break;

    default:
      throw new Error(`Unsupported provider: ${agent.provider}`);
  }

  console.log(`Making request to ${agent.provider} with model ${agent.model}`);
  
  const response = await fetch(agent.endpoint + (agent.provider === 'google' ? `?key=${agent.apiKey}` : ''), {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error from ${agent.provider}: ${error}`);
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
      throw new Error(`Unsupported provider: ${agent.provider}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agents } = await req.json();
    console.log('Processing multi-agent request:', { message, agentCount: agents.length });

    const responses = await Promise.all(
      agents.map(async (agent: Agent) => {
        try {
          const response = await makeProviderRequest(agent, message);
          return {
            provider: agent.provider,
            role: agent.role,
            response
          };
        } catch (error) {
          console.error(`Error with ${agent.provider}:`, error);
          throw error;
        }
      })
    );

    return new Response(
      JSON.stringify({ response: responses }),
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