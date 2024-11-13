import { Agent, AgentResponse } from './types.ts';

export async function makeProviderRequest(agent: Agent, prompt: string): Promise<string> {
  try {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: Record<string, any>;

    // Format the message content with role and context
    const messageContent = `Context from previous agents:\n${prompt}\n\nYour role: ${agent.role}\n\nProvide your perspective based on your role.`;

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
            { 
              role: 'system', 
              content: agent.instructions 
            },
            { 
              role: 'user', 
              content: messageContent
            }
          ],
          max_tokens: 1000
        };
        break;

      case 'claude':
        headers['x-api-key'] = agent.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: agent.model,
          system: agent.instructions,
          messages: [
            {
              role: 'user',
              content: messageContent
            }
          ],
          max_tokens: 1000
        };
        break;

      case 'google':
        body = {
          contents: [{
            role: "user",
            parts: [{
              text: `${agent.instructions}\n\n${messageContent}`
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

    console.log(`Making request to ${agent.provider} at ${endpoint}`);
    
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
    console.log(`${agent.provider} response:`, JSON.stringify(data, null, 2));

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

export async function conductVotingRound(
  agents: Agent[], 
  initialResponses: AgentResponse[]
): Promise<string> {
  // Create a context that includes all previous responses
  const context = initialResponses.map(r => 
    `${r.role.toUpperCase()} (${r.provider}):\n${r.response}`
  ).join('\n\n');

  const votingPrompt = `As an AI model participating in a collaborative task, analyze these responses and create a cohesive synthesis:

${context}

Instructions:
1. Identify the key insights from each response
2. Find common themes and complementary perspectives
3. Create a unified response that:
   - Combines the best elements from all perspectives
   - Maintains consistency and coherence
   - Addresses the original query comprehensively

Important: Focus on creating a clear, well-structured response that builds upon all previous insights.`;

  // Use each agent to provide a synthesis
  const syntheses = await Promise.all(
    agents.map(agent => makeProviderRequest(agent, votingPrompt))
  );

  // Create final synthesis prompt using all the synthesized responses
  const finalSynthesisPrompt = `Create the final, unified response based on these synthesized perspectives:

${syntheses.join('\n\n')}

Instructions:
1. Combine the key insights into one coherent response
2. Ensure all important points are included
3. Maintain a clear and focused narrative
4. Present the information in a well-structured format`;

  // Use the first agent for final synthesis
  const synthesizer = agents[0];
  console.log('Creating final synthesis using:', synthesizer.provider);
  return await makeProviderRequest(synthesizer, finalSynthesisPrompt);
}