import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const responses = [];

    for (const agent of agents) {
      try {
        let response;
        console.log(`Making request to ${agent.provider} with model ${agent.model}`);

        switch (agent.provider) {
          case 'openai':
            response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    content: agent.instructions
                  },
                  { 
                    role: 'user', 
                    content: message 
                  }
                ],
                max_tokens: 2000
              })
            });
            break;

          case 'claude':
            response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': agent.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: agent.model,
                system: agent.instructions,
                messages: [
                  {
                    role: 'user',
                    content: message
                  }
                ],
                max_tokens: 2000
              })
            });
            break;

          case 'google':
            response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${agent.model}:generateContent?key=${agent.apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  role: "user",
                  parts: [{
                    text: `${agent.instructions}\n\n${message}`
                  }]
                }],
                generationConfig: {
                  maxOutputTokens: 2000
                }
              })
            });
            break;

          case 'openrouter':
            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${agent.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': '*',
              },
              body: JSON.stringify({
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
              })
            });
            break;
        }

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Error from ${agent.provider}: ${error}`);
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
          response: agentResponse
        });

      } catch (error) {
        console.error(`Error with ${agent.provider}:`, error);
        responses.push({
          provider: agent.provider,
          response: `Error: ${error.message}`
        });
      }
    }

    // Now combine all responses into one cohesive response
    const combinedResponse = responses
      .map(r => `Response from ${r.provider}:\n${r.response}`)
      .join('\n\n---\n\n');

    return new Response(JSON.stringify({ response: combinedResponse }), {
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