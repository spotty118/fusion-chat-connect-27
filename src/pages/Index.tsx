import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import { generateResponse } from '@/lib/window-ai';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CurrentModel } from '@/components/CurrentModel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fusionMode, setFusionMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load fusion mode state from localStorage on mount
  useEffect(() => {
    const savedFusionMode = localStorage.getItem('fusionMode') === 'true';
    setFusionMode(savedFusionMode);
  }, []);

  const { data: availableModels = [] } = useQuery({
    queryKey: ['available-models'],
    queryFn: async () => {
      if (!window.ai) return [];
      const models = await window.ai.getModels();
      return models || [];
    },
    enabled: !!window.ai,
  });

  const handleModelSelect = async (model) => {
    try {
      if (window.ai?.setCurrentModel) {
        await window.ai.setCurrentModel(model);
        setSelectedModel(model);
        toast({
          title: "Model Updated",
          description: `Switched to ${model}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to switch model. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content) => {
    try {
      setIsLoading(true);
      const userMessage = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      const response = await generateResponse(content, fusionMode);
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
      <header className="bg-gradient-to-br from-fusion-primary to-fusion-secondary p-6 text-white shadow-xl sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {fusionMode ? "Fusion Chat (Multi-AI Mode)" : "Fusion Chat"}
            </h1>
            <div className="flex items-center gap-4">
              <CurrentModel />
              <div className="w-64">
                <Select
                  value={selectedModel}
                  onValueChange={handleModelSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 transition-colors duration-200 rounded-2xl w-12 h-12"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-2xl rounded-3xl my-6 overflow-hidden">
        <ChatContainer messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  );
};

export default Index;