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
    
    const response = await window.ai.generateText({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });
    
    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};