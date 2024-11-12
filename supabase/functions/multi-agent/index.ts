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

const AGENT_ROLES = {
  ANALYST: {
    role: 'analyst',
    instructions: 'You are an expert AI analyst. Break down complex problems into key components, identify patterns, and provide deep insights. Focus on understanding the core issues and their implications.'
  },
  IMPLEMENTER: {
    role: 'implementer',
    instructions: 'You are an expert AI implementer. Provide detailed, practical solutions based on thorough analysis. Consider real-world constraints and best practices while maintaining high standards.'
  },
  REVIEWER: {
    role: 'reviewer',
    instructions: 'You are an expert AI reviewer. Critically evaluate proposed solutions, identify potential issues, and suggest improvements. Consider edge cases, scalability, and long-term implications.'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agents } = await req.json();
    console.log('Processing multi-agent request:', { message, agentCount: agents.length });

    const responses = [];

    // Collect responses from all agents
    for (const agent of agents) {
      try {
        let response;
        console.log(`Making request to ${agent.provider} with model ${agent.model}`);

        switch (agent.provider) {
          case 'openai':
          case 'openrouter':
            response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${agent.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: agent.model,
                messages: [
                  { role: 'system', content: agent.instructions },
                  { role: 'user', content: message }
                ],
                temperature: 0.7,
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
                messages: [{ role: 'user', content: message }],
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
                  temperature: 0.7,
                  maxOutputTokens: 2000
                }
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
    }

    // Use GPT-4o to intelligently combine the responses
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const combinationPrompt = `
You are an expert AI response synthesizer. Your task is to create a comprehensive, intelligent response by combining insights from multiple AI agents. Each agent has analyzed the problem from a different perspective:

${responses.map(r => `${r.role.toUpperCase()} (${r.provider}):
${r.response}`).join('\n\n')}

Create a unified response that:
1. Synthesizes the key insights from all agents
2. Resolves any contradictions between responses
3. Provides a clear, coherent narrative
4. Includes practical, actionable recommendations
5. Maintains a professional and authoritative tone

Original user query: "${message}"

Combined response:`;

    const combinedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI response synthesizer that combines multiple AI perspectives into one coherent, intelligent response.'
          },
          {
            role: 'user',
            content: combinationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!combinedResponse.ok) {
      const error = await combinedResponse.text();
      throw new Error(`Error combining responses: ${error}`);
    }

    const combinedData = await combinedResponse.json();
    const finalResponse = combinedData.choices[0].message.content;

    return new Response(JSON.stringify({ response: finalResponse }), {
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