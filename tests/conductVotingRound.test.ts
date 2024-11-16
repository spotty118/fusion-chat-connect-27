import { conductVotingRound } from '../supabase/functions/multi-agent/utils';
import { Agent, AgentResponse } from '../supabase/functions/multi-agent/types';

// Mock makeProviderRequest function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content: 'Final synthesis response' } }] })
  })
) as jest.Mock<any>;

describe('conductVotingRound', () => {
  it('should conduct a voting round and return a final synthesis', async () => {
    const agents: Agent[] = [
      { provider: 'openai', model: 'text-davinci-003', role: 'researcher', instructions: '', endpoint: '', apiKey: '' },
      { provider: 'claude', model: 'claude-v1', role: 'critic', instructions: '', endpoint: '', apiKey: '' },
      { provider: 'google', model: 'gemini-1.5-pro-002', role: 'implementer', instructions: '', endpoint: '', apiKey: '' }
    ];

    const initialResponses: AgentResponse[] = [
      { provider: 'openai', role: 'researcher', response: 'Researcher response' },
      { provider: 'claude', role: 'critic', response: 'Critic response' },
      { provider: 'google', role: 'implementer', response: 'Implementer response' }
    ];

    const originalPrompt = 'Test prompt';
    const finalResponse = await conductVotingRound(agents, initialResponses, originalPrompt);

    expect(finalResponse).toBe('Final synthesis response');
    expect(global.fetch).toHaveBeenCalled();
  });
});
