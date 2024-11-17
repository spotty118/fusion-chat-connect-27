```typescript
import { Agent, AgentResponse } from './types.ts';
import { analyzePrompt } from './prompt-analysis.ts';

// Keyword-based strength adjustments for each provider
const PROVIDER_KEYWORD_STRENGTHS: Record<string, Record<string, string[]>> = {
  openai: {
    code: ['function', 'algorithm', 'programming', 'debug', 'typescript', 'javascript'],
    technical: ['explain', 'how', 'what', 'analysis', 'compare'],
    creative: ['story', 'imagine', 'creative', 'design', 'generate'],
    general: ['help', 'can', 'would', 'should', 'opinion']
  },
  claude: {
    code: ['review', 'refactor', 'optimize', 'architecture', 'pattern'],
    technical: ['research', 'paper', 'academic', 'study', 'science'],
    creative: ['write', 'novel', 'poetry', 'artistic', 'narrative'],
    general: ['discuss', 'consider', 'think', 'evaluate', 'assess']
  },
  google: {
    code: ['implement', 'build', 'develop', 'test', 'structure'],
    technical: ['technical', 'system', 'process', 'method', 'theory'],
    creative: ['innovative', 'unique', 'original', 'brainstorm', 'conceptual'],
    general: ['summarize', 'explain', 'describe', 'outline', 'review']
  },
  openrouter: {
    code: ['code', 'program', 'script', 'syntax', 'compile'],
    technical: ['document', 'specification', 'requirement', 'standard', 'protocol'],
    creative: ['design', 'create', 'invent', 'compose', 'craft'],
    general: ['analyze', 'suggest', 'recommend', 'advise', 'guide']
  }
};

// Base strengths that will be adjusted based on keywords
const BASE_STRENGTHS: Record<string, Record<string, number>> = {
  openai: { code: 0.85, technical: 0.8, creative: 0.75, general: 0.8 },
  claude: { code: 0.75, technical: 0.85, creative: 0.9, general: 0.85 },
  google: { code: 0.8, technical: 0.85, creative: 0.75, general: 0.8 },
  openrouter: { code: 0.75, technical: 0.75, creative: 0.8, general: 0.85 }
};

function calculateProviderStrength(
  provider: string,
  category: string,
  prompt: string
): number {
  const baseStrength = BASE_STRENGTHS[provider]?.[category] || 0.7;
  const keywords = PROVIDER_KEYWORD_STRENGTHS[provider]?.[category] || [];
  
  // Count how many relevant keywords are in the prompt
  const lowercasePrompt = prompt.toLowerCase();
  const matchedKeywords = keywords.filter(keyword => 
    lowercasePrompt.includes(keyword.toLowerCase())
  );
  
  // Adjust strength based on keyword matches (up to 20% boost)
  const keywordBoost = (matchedKeywords.length / keywords.length) * 0.2;
  
  console.log(`Provider ${provider} for ${category}:`, {
    baseStrength,
    matchedKeywords: matchedKeywords.join(', '),
    keywordBoost,
    finalStrength: Math.min(baseStrength + keywordBoost, 1)
  });

  return Math.min(baseStrength + keywordBoost, 1);
}

export function getBestProviderForCategory(
  category: string,
  availableProviders: string[],
  prompt: string
): string {
  let bestProvider = availableProviders[0];
  let maxStrength = 0;

  availableProviders.forEach(provider => {
    const strength = calculateProviderStrength(provider, category, prompt);
    console.log(`Provider ${provider} strength for ${category}: ${strength}`);
    
    if (strength > maxStrength) {
      maxStrength = strength;
      bestProvider = provider;
    }
  });

  console.log(`Selected ${bestProvider} as best provider for ${category} with strength ${maxStrength}`);
  return bestProvider;
}

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

export async function conductVotingRound(
  agents: Agent[],
  initialResponses: AgentResponse[],
  originalPrompt: string
): Promise<string> {
  // Analyze the prompt to understand the context and requirements
  const analysis = analyzePrompt(originalPrompt);
  console.log('Prompt analysis:', analysis);
  
  // Get the best provider for this type of prompt
  const availableProviders = agents.map(a => a.provider);
  const primaryProvider = getBestProviderForCategory(analysis.category, availableProviders, originalPrompt);
  console.log(`Selected ${primaryProvider} as primary provider based on category ${analysis.category}`);
  
  // Create a context that includes all previous responses
  const context = initialResponses.map(r => 
    `${r.role.toUpperCase()} (${r.provider}):\n${r.response}`
  ).join('\n\n');

  // Enhance the voting prompt with context awareness
  const votingPrompt = `As an AI model participating in a collaborative task, analyze these responses and create a cohesive synthesis.
Context: This is a ${analysis.category} query with key topics: ${analysis.topics.join(', ')}
Confidence in category: ${analysis.confidence}

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
   ${analysis.category === 'code' ? '   - Ensure code snippets are complete and properly formatted' : ''}
   ${analysis.category === 'technical' ? '   - Provide clear technical explanations with examples' : ''}
   ${analysis.category === 'creative' ? '   - Emphasize creative and innovative aspects' : ''}

Important: Focus on creating a clear, well-structured response that builds upon all previous insights.`;

  // Use the best provider for this category for the final synthesis
  const synthesizer = agents.find(a => a.provider === primaryProvider) || agents[0];
  console.log(`Creating final synthesis using ${synthesizer.provider} (best for ${analysis.category} category)`);
  
  return await makeProviderRequest(synthesizer, votingPrompt);
}
```