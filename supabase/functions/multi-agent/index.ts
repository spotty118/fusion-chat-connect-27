import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log('Processing multi-agent request:', { message, agents });

    const responses: AgentResponse[] = [];

    // Process each agent's response in parallel
    const agentPromises = agents.map(async (agent: any) => {
      try {
        const response = await fetch(agent.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agent.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: agent.model,
            messages: [
              {
                role: 'system',
                content: `You are a specialized AI agent focused on ${agent.role}. ${agent.instructions}`
              },
              { role: 'user', content: message }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`Error from ${agent.provider}: ${await response.text()}`);
        }

        const data = await response.json();
        let agentResponse = '';

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