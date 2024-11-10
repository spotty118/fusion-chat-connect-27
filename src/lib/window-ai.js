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

      // Handle array of responses and extract text content
      const r1 = response1?.[0]?.text || response1?.[0]?.message?.content || 'No response';
      const r2 = response2?.[0]?.text || response2?.[0]?.message?.content || 'No response';
      const r3 = response3?.[0]?.text || response3?.[0]?.message?.content || 'No response';

      return `Combined responses:\n\nGPT-4: ${r1}\n\nClaude: ${r2}\n\nPaLM: ${r3}`;
    } else {
      const response = await window.ai.generateText({
        messages: [{ role: "user", content: message }]
      });
      
      if (!response || !response.length) {
        throw new Error('No response received from Window AI');
      }

      // Extract text content from the first response
      const textContent = response[0]?.text || response[0]?.message?.content;
      if (!textContent) {
        throw new Error('No valid response content received');
      }

      return textContent;
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};