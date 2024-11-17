import { Agent, AgentResponse } from './types.ts';
import { analyzePrompt } from './prompt-analysis.ts';

export async function makeProviderRequest(agent: Agent, prompt: string): Promise<string> {
  try {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: Record<string, any>;
    let endpoint = agent.endpoint;

    // Format the message content with role and context
    const messageContent = `Context: ${agent.role}\n\nInstructions: ${agent.instructions}\n\nQuery: ${prompt}`;

    switch (agent.provider) {
      case 'openai':
      case 'openrouter':
        headers['Authorization'] = `Bearer ${agent.apiKey}`;
        if (agent.provider === 'openrouter') {
          headers['HTTP-Referer'] = Deno.env.get('APP_URL') || '*';
        }
        body = {
          model: agent.model,
          messages: [
            { role: 'system', content: agent.instructions },
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
          system: agent.instructions,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        };
        break;

      case 'google':
        // For Google, we append the API key as a query parameter
        endpoint = `${agent.endpoint}?key=${agent.apiKey}`;
        body = {
          contents: [{
            parts: [{ text: `${agent.instructions}\n\n${prompt}` }]
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

    console.log(`Making request to ${agent.provider} with role: ${agent.role}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`${agent.provider} API error:`, error);
      throw new Error(`${agent.provider} API error: ${error}`);
    }

    const data = await response.json();
    console.log(`${agent.provider} response received`);

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

export function getBestProviderForCategory(category: string, availableProviders: string[]): string {
  // Simple provider selection based on category
  switch (category) {
    case 'code':
      return availableProviders.includes('openai') ? 'openai' : availableProviders[0];
    case 'creative':
      return availableProviders.includes('claude') ? 'claude' : availableProviders[0];
    case 'technical':
      return availableProviders.includes('google') ? 'google' : availableProviders[0];
    default:
      return availableProviders[0];
  }
}

export async function conductVotingRound(
  agents: Agent[], 
  initialResponses: AgentResponse[],
  originalPrompt: string
): Promise<string> {
  // Analyze the prompt to understand the context and requirements
  const analysis = analyzePrompt(originalPrompt);
  
  // Get the best provider for this type of prompt
  const availableProviders = agents.map(a => a.provider);
  const primaryProvider = getBestProviderForCategory(analysis.category, availableProviders);
  
  // Create a context that includes all previous responses
  const context = initialResponses.map(r => 
    `${r.role.toUpperCase()} (${r.provider}):\n${r.response}`
  ).join('\n\n');

  // Enhance the voting prompt with context awareness
  const votingPrompt = `As an AI model participating in a collaborative task, analyze these responses and create a cohesive synthesis.
Context: This is a ${analysis.category} query with key topics: ${analysis.topics.join(', ')}

Previous responses:
${context}

Instructions:
1. Identify the key insights from each response
2. Find common themes and complementary perspectives
3. Create a unified response that:
   - Combines the best elements from all perspectives
   - Maintains consistency and coherence
   - Addresses the original query comprehensively
   - Focuses particularly on ${analysis.category} aspects

Important: Focus on creating a clear, well-structured response that builds upon all previous insights.`;

  // Prioritize the best provider for this category for the final synthesis
  const synthesizer = agents.find(a => a.provider === primaryProvider) || agents[0];
  console.log(`Creating final synthesis using ${synthesizer.provider} (best for ${analysis.category} category)`);
  
  return await makeProviderRequest(synthesizer, votingPrompt);
}