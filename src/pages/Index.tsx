import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { generateResponse } from '@/lib/window-ai';
import { ChatSearch } from '@/components/chat/ChatSearch';
import { ChatExport } from '@/components/chat/ChatExport';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import FusionSidePanel from '@/components/FusionSidePanel';
import MainChatPanel from '@/components/MainChatPanel';
import { cn } from '@/lib/utils';
import { FusionResponse } from '@/lib/fusion-mode';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useFusionMode } from '@/hooks/useFusionMode';

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
  const { isFusionMode } = useFusionMode();

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

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      const userMessage = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      if (isFusionMode) {
        setFusionResponses([]);
        setSidePanelOpen(true);
      }

      const response = await generateResponse(content);
      
      if (isFusionMode && typeof response === 'object' && response !== null) {
        const fusionResponse = response as FusionResponse;
        if (fusionResponse.providers && Array.isArray(fusionResponse.providers)) {
          setFusionResponses(fusionResponse.providers.map(p => ({
            ...p,
            timestamp: new Date().toLocaleTimeString()
          })));
          
          const aiMessage = { 
            role: 'assistant', 
            content: fusionResponse
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error('Invalid fusion response format');
        }
      } else {
        const aiMessage = { 
          role: 'assistant', 
          content: response
        };
        setMessages(prev => [...prev, aiMessage]);
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
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      <ChatHeader 
        isFusionMode={isFusionMode}
        sidePanelOpen={sidePanelOpen}
        onToggleSidePanel={() => setSidePanelOpen(!sidePanelOpen)}
      />
      
      <div className="flex-none p-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-[calc(100%-2rem)] mx-auto w-full flex justify-between items-center gap-4">
          <ChatSearch onSearch={handleSearch} />
          <ChatExport messages={messages} />
        </div>
      </div>
      
      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        <div className={cn(
          "flex gap-6 w-full transition-all duration-300",
          sidePanelOpen ? "justify-between" : "justify-center"
        )}>
          <MainChatPanel
            messages={filteredMessages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            inputRef={inputRef}
          />
          {sidePanelOpen && isFusionMode && (
            <FusionSidePanel
              isOpen={sidePanelOpen}
              onClose={() => setSidePanelOpen(false)}
              responses={fusionResponses}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;