export const checkWindowAI = () => {
  if (!window?.ai) {
    throw new Error(
      "Window AI not found! Please install the Chrome extension: https://windowai.io"
    );
  }
  return true;
};

export const generateResponse = async (message) => {
  try {
    checkWindowAI();
    
    // In a real implementation, you would get this value from a global state management solution
    const fusionMode = false; // This would come from your state management
    
    if (fusionMode) {
      // When fusion mode is enabled, make three parallel requests and combine results
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

      // Combine the responses (this is a simple concatenation, you might want to implement
      // a more sophisticated combination logic)
      return `Combined responses:\n\nGPT-4: ${response1}\n\nClaude: ${response2}\n\nPaLM: ${response3}`;
    } else {
      // When fusion mode is disabled, use a single model through OpenRouter
      const response = await window.ai.generateText({
        messages: [{ role: "user", content: message }],
        model: "openai/gpt-4", // This would be your default model
      });
      
      return response;
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};