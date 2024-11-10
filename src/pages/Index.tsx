import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import { generateResponse } from '@/lib/window-ai';

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (content) => {
    try {
      setIsLoading(true);
      // Add user message
      const userMessage = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await generateResponse(content);
      const aiMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-fusion-primary to-fusion-secondary p-4 text-white">
        <h1 className="text-xl font-bold text-center">Fusion Chat</h1>
      </header>
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-lg">
        <ChatContainer messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  );
};

export default Index;