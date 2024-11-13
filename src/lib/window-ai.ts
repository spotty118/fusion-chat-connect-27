import { FusionResponse } from './fusion-mode';
import { toast } from '@/components/ui/use-toast';

export async function generateResponse(content: string): Promise<string | FusionResponse> {
  try {
    // First check if window.ai exists
    if (!window.ai) {
      throw new Error('Window AI is not available');
    }

    const response = await window.ai.generateText({
      messages: [{ role: "user", content }]
    });

    // Validate the response
    if (!response || !Array.isArray(response) || response.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    const firstResponse = response[0];
    if (firstResponse.message?.content) {
      return firstResponse.message.content;
    }
    if (firstResponse.text) {
      return firstResponse.text;
    }
    if (firstResponse.delta?.content) {
      return firstResponse.delta.content;
    }

    throw new Error('Invalid response format from AI');
  } catch (error) {
    // Log the error for debugging
    console.error('Error generating response:', error);
    
    // Show a user-friendly error message
    toast({
      title: "Error generating response",
      description: error.message || "Something went wrong. Please try again.",
      variant: "destructive",
    });

    // Re-throw the error to be handled by the caller
    throw error;
  }
}