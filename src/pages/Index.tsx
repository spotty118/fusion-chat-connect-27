import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import { Settings as SettingsIcon, LogOut, SplitSquareHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrentModel } from '@/components/CurrentModel';
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from 'react';
import { generateResponse } from '@/lib/window-ai';
import { ChatSearch } from '@/components/chat/ChatSearch';
import { ChatExport } from '@/components/chat/ChatExport';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import FusionSidePanel from '@/components/FusionSidePanel';
import { cn } from '@/lib/utils';

interface FusionResponse {
  final: string;
  providers: Array<{
    provider: string;
    role: string;
    response: string;
  }>;
}

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [fusionResponses, setFusionResponses] = useState([]);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFusionMode = localStorage.getItem('fusionMode') === 'true';

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

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      const userMessage = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      if (isFusionMode) {
        setFusionResponses([]); // Clear previous responses
        setSidePanelOpen(true);
      }

      const response = await generateResponse(content, isFusionMode);
      
      if (isFusionMode && typeof response === 'object' && response !== null) {
        const fusionResponse = response as FusionResponse;
        if (fusionResponse.providers && Array.isArray(fusionResponse.providers)) {
          setFusionResponses(fusionResponse.providers.map(p => ({
            ...p,
            timestamp: new Date().toLocaleTimeString()
          })));
          
          const aiMessage = { 
            role: 'assistant', 
            content: fusionResponse.final 
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error('Invalid fusion response format');
        }
      } else if (typeof response === 'string') {
        const aiMessage = { 
          role: 'assistant', 
          content: response
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid response format');
      }
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

  const handleReply = (content: string) => {
    inputRef.current?.focus();
    const quote = `> ${content}\n\n`;
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).value = quote;
    }
  };

  useKeyboardShortcuts({
    onSend: () => inputRef.current?.form?.requestSubmit(),
    onSearch: () => {
      setSearchOpen(true);
      setTimeout(() => {
        const searchElement = document.querySelector('[aria-label="Export Chat"]') as HTMLButtonElement;
        searchElement?.click();
      }, 0);
    },
    onExport: () => {
      const exportButton = document.querySelector('[aria-label="Export Chat"]') as HTMLButtonElement;
      exportButton?.click();
    },
    onSettings: () => navigate('/settings'),
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-gradient-to-br from-fusion-primary to-fusion-secondary p-6 text-white shadow-2xl sticky top-0 z-10 backdrop-blur-lg bg-opacity-95">
        <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">ThinkLink</h1>
            <CurrentModel />
          </div>
          <div className="flex items-center gap-3">
            {isFusionMode && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 transition-all duration-300 rounded-2xl w-12 h-12 hover:scale-105"
                onClick={() => setSidePanelOpen(!sidePanelOpen)}
              >
                <SplitSquareHorizontal className="h-5 w-5" />
              </Button>
            )}
            <KeyboardShortcuts />
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
      
      <div className="flex-none p-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center gap-4">
          <ChatSearch onSearch={handleSearch} />
          <ChatExport messages={messages} />
        </div>
      </div>
      
      <div className="flex flex-1 relative">
        <main 
          className={cn(
            "flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl my-6 overflow-hidden border border-gray-100",
            "transition-all duration-300 ease-in-out",
            sidePanelOpen && "opacity-50 pointer-events-none"
          )}
        >
          <ChatContainer 
            messages={filteredMessages} 
            isLoading={isLoading}
            onReply={handleReply}
          />
          <ChatInput 
            ref={inputRef}
            onSendMessage={handleSendMessage} 
            disabled={isLoading} 
          />
        </main>

        <FusionSidePanel
          isOpen={sidePanelOpen && isFusionMode}
          onClose={() => setSidePanelOpen(false)}
          responses={fusionResponses}
        />
      </div>
    </div>
  );
};

export default Index;