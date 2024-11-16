import { analyzePrompt } from '../supabase/functions/multi-agent/prompt-analysis';

describe('analyzePrompt', () => {
  it('should correctly analyze a creative prompt', () => {
    const prompt = 'Write a creative story about a dragon';
    const analysis = analyzePrompt(prompt);

    expect(analysis.category).toBe('creative');
    expect(analysis.topics).toContain('dragon');
    expect(analysis.confidence).toBeGreaterThan(0);
  });

  it('should correctly analyze a technical prompt', () => {
    const prompt = 'Explain how a computer works';
    const analysis = analyzePrompt(prompt);

    expect(analysis.category).toBe('technical');
    expect(analysis.topics).toContain('computer');
    expect(analysis.confidence).toBeGreaterThan(0);
  });

  it('should correctly analyze a code-related prompt', () => {
    const prompt = 'Write a function to sort an array';
    const analysis = analyzePrompt(prompt);

    expect(analysis.category).toBe('code');
    expect(analysis.topics).toContain('function');
    expect(analysis.confidence).toBeGreaterThan(0);
  });

  it('should correctly analyze a general prompt', () => {
    const prompt = 'Can you help me with my homework?';
    const analysis = analyzePrompt(prompt);

    expect(analysis.category).toBe('general');
    expect(analysis.topics).toContain('homework');
    expect(analysis.confidence).toBeGreaterThan(0);
  });
});
