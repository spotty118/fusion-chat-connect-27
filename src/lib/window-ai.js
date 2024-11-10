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

      // Extract content from standardized response format
      const extractContent = (response) => {
        if (!response?.length) return 'No response';
        const choice = response[0];
        if (choice.message?.content) return choice.message.content;
        if (choice.text) return choice.text;
        if (choice.delta?.content) return choice.delta.content;
        return 'No valid content';
      };

      const r1 = extractContent(response1);
      const r2 = extractContent(response2);
      const r3 = extractContent(response3);

      return `Combined responses:\n\nGPT-4: ${r1}\n\nClaude: ${r2}\n\nPaLM: ${r3}`;
    } else {
      const response = await window.ai.generateText({
        messages: [{ role: "user", content: message }]
      });
      
      if (!response?.length) {
        throw new Error('No response received from Window AI');
      }

      const choice = response[0];
      let content = null;

      if (choice.message?.content) {
        content = choice.message.content;
      } else if (choice.text) {
        content = choice.text;
      } else if (choice.delta?.content) {
        content = choice.delta.content;
      }

      if (!content) {
        throw new Error('No valid response content received');
      }

      return content;
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};