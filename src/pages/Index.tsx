import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import { generateResponse } from '@/lib/window-ai';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      <header className="bg-gradient-to-r from-fusion-primary to-fusion-secondary p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Fusion Chat</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate('/settings')}
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-lg">
        <ChatContainer messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  );
};

export default Index;