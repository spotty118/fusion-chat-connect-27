import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrentModel } from '@/components/CurrentModel';
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from 'react';
import { generateResponse } from '@/lib/window-ai';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { ChatSearch } from '@/components/chat/ChatSearch';
import { ChatExport } from '@/components/chat/ChatExport';

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fusionMode, setFusionMode] = useState(() => {
    return localStorage.getItem('fusionMode') === 'true';
  });
  const [filteredMessages, setFilteredMessages] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setFilteredMessages(messages);
  }, [messages]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredMessages(messages);
      return;
    }
    const filtered = messages.filter((msg) => 
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMessages(filtered);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-gradient-to-br from-fusion-primary to-fusion-secondary p-6 text-white shadow-2xl sticky top-0 z-10 backdrop-blur-lg bg-opacity-95">
        <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {fusionMode ? "ThinkLink (Multi-AI Mode)" : "ThinkLink"}
            </h1>
            <CurrentModel />
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-all duration-300 rounded-2xl w-12 h-12 hover:scale-105"
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-all duration-300 rounded-2xl w-12 h-12 hover:scale-105"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-none p-4 border-b bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center gap-4">
          <ChatSearch onSearch={handleSearch} />
          <ChatExport messages={messages} />
        </div>
      </div>
      
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-2xl rounded-3xl my-6 overflow-hidden border border-gray-100 dark:border-gray-700">
        <ChatContainer messages={filteredMessages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  );
};

export default Index;