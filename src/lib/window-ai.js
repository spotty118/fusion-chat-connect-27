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

      // Extract text from responses
      const r1 = typeof response1 === 'string' ? response1 : response1?.text || 'No response';
      const r2 = typeof response2 === 'string' ? response2 : response2?.text || 'No response';
      const r3 = typeof response3 === 'string' ? response3 : response3?.text || 'No response';

      return `Combined responses:\n\nGPT-4: ${r1}\n\nClaude: ${r2}\n\nPaLM: ${r3}`;
    } else {
      const completion = await window.ai.generateText({
        messages: [{ role: "user", content: message }]
      });
      
      if (!completion) {
        return 'No response received from Window AI';
      }
      
      return typeof completion === 'string' ? completion : completion?.text || 'No response';
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};