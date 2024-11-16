import { makeProviderRequest } from '../supabase/functions/multi-agent/utils';
import { Agent } from '../supabase/functions/multi-agent/types';

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content: 'Test response' } }] })
  })
) as jest.Mock<any>;


describe('makeProviderRequest', () => {
  it('should make a request to the provider and return a response', async () => {
    const agent: Agent = {
      provider: 'openai',
      model: 'text-davinci-003',
      role: 'researcher',
      instructions: 'Test instructions',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'test-api-key'
    };

    const prompt = 'Test prompt';
    const response = await makeProviderRequest(agent, prompt);

    expect(response).toBe('Test response');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key'
        })
      })
    );
  });
});
