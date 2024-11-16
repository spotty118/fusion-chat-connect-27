import { generateFusionResponse } from '../src/lib/fusion-mode';
import nock from 'nock';

describe('Integration Test: Fusion Model', () => {
  beforeAll(() => {
    // Mock API responses
    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, { choices: [{ message: { content: 'OpenAI response' } }] });

    nock('https://api.anthropic.com')
      .post('/v1/messages')
      .reply(200, { choices: [{ message: { content: 'Claude response' } }] });

    nock('https://generativelanguage.googleapis.com')
      .post('/v1/models/gemini-1.5-pro-002:generateContent')
      .reply(200, { candidates: [{ content: { parts: [{ text: 'Google response' }] } }] });
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should generate a fusion response with multiple providers', async () => {
    const message = 'Test message';
    const response = await generateFusionResponse(message);

    expect(response.final).toBeDefined();
    expect(response.providers).toHaveLength(3);
    expect(response.providers.map(p => p.response)).toEqual(
      expect.arrayContaining(['OpenAI response', 'Claude response', 'Google response'])
    );
  });
});
