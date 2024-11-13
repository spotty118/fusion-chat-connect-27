import { FusionResponse } from './fusion-mode';
import { toast } from '@/components/ui/use-toast';

export async function generateResponse(content: string): Promise<string | FusionResponse> {
  try {
    // First check if window.ai exists
    if (!window.ai) {
      throw new Error('Window AI is not available');
    }

    const response = await window.ai.generateText(content);

    // Validate the response
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response format from AI');
    }

    return response;
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