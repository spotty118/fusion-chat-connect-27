export const checkWindowAI = () => {
  if (typeof window === 'undefined' || !window?.ai) {
    throw new Error(
      "Window AI not found! Please install the Chrome extension: https://windowai.io"
    );
  }
  return true;
};

export const generateResponse = async (message, fusionMode = false) => {
  try {
    checkWindowAI();
    
    if (fusionMode) {
      const [response1, response2, response3] = await Promise.all([
        window.ai.generateText({
          messages: [{ role: "user", content: message }],
          model: "openai/gpt-4",
        }),
        window.ai.generateText({
          messages: [{ role: "user", content: message }],
          model: "anthropic/claude-2",
        }),
        window.ai.generateText({
          messages: [{ role: "user", content: message }],
          model: "google/palm-2",
        }),
      ]);

      // Window AI returns the response directly as a string
      return `Combined responses:\n\nGPT-4: ${response1}\n\nClaude: ${response2}\n\nPaLM: ${response3}`;
    } else {
      const response = await window.ai.generateText({
        messages: [{ role: "user", content: message }]
      });
      
      // Window AI returns the response directly as a string
      return response;
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};