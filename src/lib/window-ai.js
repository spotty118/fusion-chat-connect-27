const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const waitForWindowAI = async (retries = 0) => {
  if (typeof window !== 'undefined' && window?.ai) {
    return true;
  }

  if (retries >= MAX_RETRIES) {
    throw new Error(
      "Window AI not found! Please install the Chrome extension: https://windowai.io"
    );
  }

  // Wait for 1 second
  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  return waitForWindowAI(retries + 1);
};

export const checkWindowAI = async () => {
  return waitForWindowAI();
};

const generateSingleResponse = async (message, model) => {
  try {
    const response = await window.ai.generateText({
      messages: [{ role: "user", content: message }],
      model: model,
    });

    if (!response?.length) {
      throw new Error('No response received');
    }

    const choice = response[0];
    if (choice.message?.content) return choice.message.content;
    if (choice.text) return choice.text;
    if (choice.delta?.content) return choice.delta.content;
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error(`Error with ${model}:`, error);
    return `Error from ${model}: ${error.message}`;
  }
};

export const generateResponse = async (message, fusionMode = false) => {
  try {
    await checkWindowAI();
    
    if (fusionMode) {
      // Generate responses from multiple providers in parallel
      const responses = await Promise.allSettled([
        generateSingleResponse(message, "openai/gpt-4o"),
        generateSingleResponse(message, "anthropic/claude-2"),
        generateSingleResponse(message, "google/palm-2")
      ]);

      // Format the combined response
      const formattedResponses = responses.map((result, index) => {
        const provider = ["GPT-4", "Claude", "PaLM"][index];
        const content = result.status === 'fulfilled' ? result.value : `Error: ${result.reason}`;
        return `${provider}:\n${content}`;
      });

      // Combine all responses with clear separation
      return formattedResponses.join('\n\n---\n\n');
    } else {
      // Single provider mode - use current model
      const response = await window.ai.generateText({
        messages: [{ role: "user", content: message }]
      });
      
      if (!response?.length) {
        throw new Error('No response received from Window AI');
      }

      const choice = response[0];
      if (choice.message?.content) return choice.message.content;
      if (choice.text) return choice.text;
      if (choice.delta?.content) return choice.delta.content;
      
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};