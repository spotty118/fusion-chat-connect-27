const API_BASE_URL = 'https://api.gptengineer.app';

export const fetchModelsFromBackend = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};