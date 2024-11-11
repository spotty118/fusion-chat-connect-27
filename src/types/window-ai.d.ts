interface Window {
  ai: {
    getCurrentModel: () => Promise<string>;
    setCurrentModel?: (model: string) => Promise<void>;
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