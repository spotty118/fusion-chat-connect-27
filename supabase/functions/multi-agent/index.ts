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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROLE_INSTRUCTIONS = {
  analyst: "You are an AI analyst. Analyze the problem and break it down into key components. Focus on understanding requirements and identifying potential challenges.",
  implementer: "You are an AI implementer. Based on the analysis, provide concrete solutions or implementations. Be specific and practical.",
  reviewer: "You are an AI reviewer. Review the proposed implementation, identify potential issues, and suggest improvements. Consider edge cases and best practices. Do not create new content, focus on reviewing what others have produced.",
  optimizer: "You are an AI optimizer. Focus on optimizing the solution for efficiency, scalability, and performance. Suggest specific improvements and optimizations."
};

async function makeProviderRequest(agent: Agent, message: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let body;
  const roleInstructions = ROLE_INSTRUCTIONS[agent.role as keyof typeof ROLE_INSTRUCTIONS] || agent.instructions;

  switch (agent.provider) {
    case 'openai':
      headers['Authorization'] = `Bearer ${agent.apiKey}`;
      body = {
        model: agent.model,
        messages: [
          { role: 'system', content: roleInstructions },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
      };
      break;

    case 'openrouter':
      headers['Authorization'] = `Bearer ${agent.apiKey}`;
      headers['HTTP-Referer'] = Deno.env.get('APP_URL') ?? '*';
      body = {
        model: agent.model,
        messages: [
          { role: 'system', content: roleInstructions },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
      };
      break;

    case 'claude':
      headers['x-api-key'] = agent.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: agent.model,
        system: roleInstructions,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      };
      break;

    case 'google':
      body = {
        contents: [{
          role: "user",
          parts: [{
            text: `${roleInstructions}\n\n${message}`
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

  console.log(`Making request to ${agent.provider} with model ${agent.model}`);
  console.log('Request body:', body);
  
  const response = await fetch(agent.endpoint + (agent.provider === 'google' ? `?key=${agent.apiKey}` : ''), {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Error from ${agent.provider}:`, error);
    throw new Error(`Error from ${agent.provider}: ${error}`);
  }

  const data = await response.json();
  console.log(`${agent.provider} API response:`, data);
  
  try {
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
    console.error(`Error parsing response from ${agent.provider}:`, error);
    console.error('Full response:', data);
    return `[Error parsing ${agent.provider} response]`;
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
            response: response || `[No response from ${agent.provider}]`
          };
        } catch (error) {
          console.error(`Error with ${agent.provider}:`, error);
          return {
            provider: agent.provider,
            role: agent.role,
            response: `[${agent.provider} error: ${error.message}]`
          };
        }
      })
    );

    // Filter out error responses and empty responses
    const validResponses = responses.filter(r => 
      !r.response.startsWith('[') && 
      !r.response.includes('error') &&
      r.response.trim().length > 0
    );

    // If we have at least one valid response, return those
    const finalResponses = validResponses.length > 0 ? validResponses : responses;

    return new Response(
      JSON.stringify({ response: finalResponses }),
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