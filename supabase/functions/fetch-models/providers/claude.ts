export async function fetchClaudeModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (!response.ok) {
      console.error('Claude API verification failed:', await response.text());
      return [];
    }

    // Return the latest Claude models if API key is valid
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1'
    ];
  } catch (error) {
    console.error('Error verifying Claude API key:', error);
    return [];
  }
}