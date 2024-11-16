import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { ChatExport } from '@/components/chat/ChatExport';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSearch } from '@/components/chat/ChatSearch';
import FusionSidePanel from '@/components/FusionSidePanel';
import MainChatPanel from '@/components/MainChatPanel';
import { cn } from '@/lib/utils';
import { FusionResponse } from '@/lib/fusion-mode';
import { useFusionMode } from '@/hooks/useFusionMode';
import { Settings } from 'lucide-react';

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [fusionResponses, setFusionResponses] = useState([]);
  const inputRef = useRef(null);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-white p-4 shadow-sm border-r">
        <button className="w-full bg-gradient-to-r from-fusion-primary to-fusion-secondary text-white rounded-2xl py-3 mb-4 hover:opacity-90 transition-opacity">
          + New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto">
          {['Fusion Chat 1', 'Fusion Chat 2', 'Fusion Chat 3'].map((chat, i) => (
            <button
              key={i}
              className="w-full text-left p-3 rounded-xl mb-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {chat}
            </button>
          ))}
        </div>
        
        <button className="flex items-center justify-center gap-2 p-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ChatHeader 
          isFusionMode={isFusionMode}
          sidePanelOpen={sidePanelOpen}
          onToggleSidePanel={() => setSidePanelOpen(!sidePanelOpen)}
        />
        
        <div className={cn(
          "flex-none p-4 border-b bg-white/50 backdrop-blur-sm",
          sidePanelOpen ? "" : "flex justify-center"
        )}>
          <div className={cn(
            "w-full flex justify-between items-center gap-4",
            sidePanelOpen ? "max-w-full" : "max-w-4xl"
          )}>
            <ChatSearch onSearch={handleSearch} />
            <ChatExport messages={messages} />
          </div>
        </div>
        
        <div className={cn(
          "flex flex-1 gap-6 p-6 overflow-hidden",
          sidePanelOpen ? "justify-between" : "justify-center"
        )}>
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
    </div>
  );
};

export default Index;
