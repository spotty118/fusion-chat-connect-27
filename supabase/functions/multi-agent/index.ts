import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentResponse {
  provider: string;
  role: string;
  response: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agents } = await req.json();
    console.log('Processing multi-agent request:', { message, agentCount: agents.length });

    const responses: AgentResponse[] = [];

    // Process each agent's response in parallel
    const agentPromises = agents.map(async (agent: any) => {
      try {
        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        let body: any = {};

        // Configure request based on provider
        switch (agent.provider) {
          case 'openai':
            headers['Authorization'] = `Bearer ${agent.apiKey}`;
            body = {
              model: agent.model,
              messages: [
                {
                  role: 'system',
                  content: agent.instructions
                },
                { 
                  role: 'user', 
                  content: message 
                }
              ],
              max_tokens: 2000
            };
            break;

          case 'claude':
            headers['x-api-key'] = agent.apiKey;
            headers['anthropic-version'] = '2023-06-01';
            body = {
              model: agent.model,
              max_tokens: 2000,
              messages: [
                {
                  role: 'user',
                  content: `${agent.instructions}\n\nUser message: ${message}`
                }
              ]
            };
            break;

          case 'google':
            agent.endpoint = `${agent.endpoint}?key=${agent.apiKey}`;
            body = {
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${agent.instructions}\n\n${message}`
                    }
                  ]
                }
              ],
              generationConfig: {
                maxOutputTokens: 2000
              }
            };
            break;

          case 'openrouter':
            headers['Authorization'] = `Bearer ${agent.apiKey}`;
            headers['HTTP-Referer'] = '*';
            body = {
              model: agent.model,
              max_tokens: 2000,
              messages: [
                {
                  role: 'system',
                  content: agent.instructions
                },
                {
                  role: 'user',
                  content: message
                }
              ]
            };
            break;
        }

        console.log(`Making request to ${agent.provider} with model ${agent.model}`);
        
        const response = await fetch(agent.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error from ${agent.provider}: ${errorText}`);
        }

        const data = await response.json();
        let agentResponse = '';

        // Extract response based on provider
        switch (agent.provider) {
          case 'openai':
          case 'openrouter':
            agentResponse = data.choices[0].message.content;
            break;
          case 'claude':
            agentResponse = data.content[0].text;
            break;
          case 'google':
            agentResponse = data.candidates[0].content.parts[0].text;
            break;
        }

        responses.push({
          provider: agent.provider,
          role: agent.role,
          response: agentResponse
        });

      } catch (error) {
        console.error(`Error with ${agent.provider}:`, error);
        responses.push({
          provider: agent.provider,
          role: agent.role,
          response: `Error: ${error.message}`
        });
      }
    });

    await Promise.all(agentPromises);

    // Sort responses by role to maintain consistent order
    responses.sort((a, b) => a.role.localeCompare(b.role));

    return new Response(JSON.stringify({ responses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in multi-agent function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});