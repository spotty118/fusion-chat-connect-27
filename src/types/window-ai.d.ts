interface Window {
  ai: {
    getCurrentModel: () => Promise<string>;
    generateText: (params: {
      messages: Array<{ role: string; content: string }>;
      model?: string;
    }) => Promise<Array<{
      message?: { content: string };
      text?: string;
      delta?: { content: string };
    }>>;
  };
}