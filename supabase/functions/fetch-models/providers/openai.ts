export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.data
      .filter((model: { id: string }) => 
        (model.id.includes('gpt-4') || model.id.includes('gpt-3.5')) &&
        !model.id.includes('vision') &&
        !model.id.includes('instruct')
      )
      .map((model: { id: string }) => model.id)
      .sort()
      .reverse();
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    return [];
  }
}