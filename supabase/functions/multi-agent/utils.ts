import { Agent, AgentResponse } from './types.ts';
import { analyzePrompt } from './prompt-analysis.ts';
import { getBestProviderForCategory } from './provider-selection.ts';
import { makeProviderRequest } from './request-handler.ts';

export { getBestProviderForCategory, makeProviderRequest };

export async function conductVotingRound(
  agents: Agent[],
  initialResponses: AgentResponse[],
  originalPrompt: string
): Promise<string> {
  const analysis = analyzePrompt(originalPrompt);
  console.log('Prompt analysis:', analysis);
  
  const availableProviders = agents.map(a => a.provider);
  const primaryProvider = getBestProviderForCategory(analysis.category, availableProviders, originalPrompt);
  console.log(`Selected ${primaryProvider} as primary provider based on category ${analysis.category}`);
  
  const context = initialResponses.map(r => 
    `${r.role.toUpperCase()} (${r.provider}):\n${r.response}`
  ).join('\n\n');

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

  const synthesizer = agents.find(a => a.provider === primaryProvider) || agents[0];
  console.log(`Creating final synthesis using ${synthesizer.provider} (best for ${analysis.category} category)`);
  
  return await makeProviderRequest(synthesizer, votingPrompt);
}