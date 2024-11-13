import { Agent } from './types';

export async function makeProviderRequest(agent: Agent, prompt: string): Promise<string> {
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
            { role: 'user', content: prompt }
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
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        };
        break;

      case 'google':
        body = {
          contents: [{
            role: "user",
            parts: [{
              text: prompt
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

export async function conductVotingRound(
  agents: Agent[], 
  initialResponses: Array<{ provider: string; role: string; response: string }>
): Promise<string> {
  const votingPrompt = `As AI models collaborating on a creative task, analyze these responses and vote on the best elements to create one cohesive output:

${initialResponses.map(r => `${r.role.toUpperCase()} (${r.provider}):
${r.response}`).join('\n\n')}

Please:
1. Vote on which response best achieves the creative goal
2. Identify the strongest creative elements
3. Create ONE unified creative piece that captures the best elements

Important: For creative tasks like poems, stories, or creative writing, do NOT explain the process - just provide the final creative piece.`;

  // Use each agent to vote and provide recommendations
  const votingResponses = await Promise.all(
    agents.map(agent => makeProviderRequest(agent, votingPrompt))
  );

  // Create final synthesis prompt
  const synthesisPrompt = `Based on the voting results from all agents:

${votingResponses.join('\n\n')}

Create the final creative piece. Important:
1. Only output the final creative work
2. Do not include any explanations or analysis
3. Keep it concise and focused
4. Maintain the original creative intent`;

  // Use the first agent for final synthesis
  const synthesizer = agents[0];
  console.log('Creating final synthesis using:', synthesizer.provider);
  return await makeProviderRequest(synthesizer, synthesisPrompt);
}
