const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const AUTH_COOKIE_NAME = 'window_ai_verified';

const isVerified = () => {
  return document.cookie.includes(AUTH_COOKIE_NAME);
};

const setVerified = () => {
  // Set cookie to expire in 30 days
  const date = new Date();
  date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
  document.cookie = `${AUTH_COOKIE_NAME}=true; expires=${date.toUTCString()}; path=/`;
};

const waitForWindowAI = async (retries = 0) => {
  if (typeof window !== 'undefined' && window?.ai) {
    if (!isVerified()) {
      setVerified();
    }
    return true;
  }

  if (retries >= MAX_RETRIES && !isVerified()) {
    throw new Error(
      "Window AI not found! Please install the Chrome extension: https://windowai.io"
    );
  }

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  return waitForWindowAI(retries + 1);
};

export const checkWindowAI = async () => {
  if (isVerified()) {
    return true;
  }
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
    return null;
  }
};

const combineResponses = async (responses) => {
  // Filter out any failed responses
  const validResponses = responses
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);

  if (validResponses.length === 0) {
    throw new Error('No valid responses received from any AI provider');
  }

  // Create a prompt to combine the responses
  const combinationPrompt = `
    You are a response curator. Below are different responses from AI models to the same prompt.
    Your task is to create ONE perfect response that combines the best insights from all responses.
    The response should be clear, concise, and well-structured.

    Responses to combine:
    ${validResponses.join('\n\n---\n\n')}

    Create one perfect response:`;

  // Use the first available model to combine responses
  try {
    const combinedResponse = await window.ai.generateText({
      messages: [{ role: "user", content: combinationPrompt }],
    });

    if (!combinedResponse?.length) {
      throw new Error('No combined response received');
    }

    const choice = combinedResponse[0];
    if (choice.message?.content) return choice.message.content;
    if (choice.text) return choice.text;
    if (choice.delta?.content) return choice.delta.content;

    throw new Error('Invalid combined response format');
  } catch (error) {
    console.error("Error combining responses:", error);
    // Fallback to the first valid response if combination fails
    return validResponses[0];
  }
};

export const generateResponse = async (message, fusionMode = false) => {
  try {
    await checkWindowAI();
    
    if (fusionMode) {
      // Generate responses from multiple providers in parallel
      const responses = await Promise.allSettled([
        generateSingleResponse(message, "openai/gpt-4"),
        generateSingleResponse(message, "anthropic/claude-2"),
        generateSingleResponse(message, "google/palm-2")
      ]);

      // Combine responses into one perfect response
      return await combineResponses(responses);
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