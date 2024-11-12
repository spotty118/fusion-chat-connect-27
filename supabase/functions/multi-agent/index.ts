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
  analyst: "You are an AI analyst in a team discussion. First analyze the problem, then participate in a discussion with other AIs to reach the best solution. Focus on understanding requirements and identifying potential challenges.",
  implementer: "You are an AI implementer in a team discussion. Based on the analysis, propose solutions, then participate in a discussion with other AIs to reach the best approach. Be specific and practical.",
  reviewer: "You are an AI reviewer in a team discussion. Review the proposed solutions, identify potential issues, and participate in a discussion with other AIs to reach consensus on improvements. Consider edge cases and best practices.",
  optimizer: "You are an AI optimizer in a team discussion. Focus on optimization opportunities, then participate in a discussion with other AIs to reach the best optimized solution. Suggest specific improvements."
};

async function makeProviderRequest(agent: Agent, message: string, context = "") {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let body;
  const roleInstructions = ROLE_INSTRUCTIONS[agent.role as keyof typeof ROLE_INSTRUCTIONS] || agent.instructions;
  const fullContext = context ? 
    `${roleInstructions}\n\nPrevious discussion:\n${context}\n\nContinue the discussion and work towards a consensus.` :
    roleInstructions;

  switch (agent.provider) {
    case 'openai':
      headers['Authorization'] = `Bearer ${agent.apiKey}`;
      body = {
        model: agent.model,
        messages: [
          { role: 'system', content: fullContext },
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
          { role: 'system', content: fullContext },
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
        system: fullContext,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      };
      break;

    case 'google':
      body = {
        contents: [{
          role: "user",
          parts: [{
            text: `${fullContext}\n\n${message}`
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

async function facilitateDiscussion(agents: Agent[], userMessage: string) {
  let discussion = "";
  let round = 1;
  const maxRounds = 3;

  // Initial responses
  console.log("Starting initial response round...");
  const initialResponses = await Promise.all(
    agents.map(async (agent) => {
      const response = await makeProviderRequest(agent, userMessage);
      return `[${agent.provider} - ${agent.role}]: ${response}`;
    })
  );
  discussion = initialResponses.join("\n\n");

  // Discussion rounds
  while (round < maxRounds) {
    console.log(`Starting discussion round ${round}...`);
    const roundPrompt = `Based on the discussion so far, what's your perspective? Let's work together to reach the best solution.`;
    
    const responses = await Promise.all(
      agents.map(async (agent) => {
        const response = await makeProviderRequest(agent, roundPrompt, discussion);
        return `[${agent.provider} - ${agent.role}]: ${response}`;
      })
    );
    
    discussion += "\n\n--- Round " + round + " ---\n\n" + responses.join("\n\n");
    round++;
  }

  // Final consensus round
  console.log("Starting final consensus round...");
  const consensusPrompt = "Based on our discussion, please provide a final consensus response that represents our collective best answer. Focus on clarity and practicality.";
  
  const consensusResponses = await Promise.all(
    agents.map(async (agent) => {
      const response = await makeProviderRequest(agent, consensusPrompt, discussion);
      return response;
    })
  );

  // Select the most comprehensive consensus response
  const finalResponse = consensusResponses.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );

  return {
    finalResponse,
    discussion
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agents } = await req.json();
    console.log('Processing multi-agent request:', { message, agentCount: agents.length });

    if (!agents || agents.length < 2) {
      throw new Error('At least 2 agents are required for a meaningful discussion');
    }

    const { finalResponse, discussion } = await facilitateDiscussion(agents, message);

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        discussion: discussion 
      }),
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