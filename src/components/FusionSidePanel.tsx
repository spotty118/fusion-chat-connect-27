import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ProviderResponse {
  provider: string;
  role: string;
  response: string;
  timestamp?: string;
}

interface FusionSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  responses: ProviderResponse[];
}

const FusionSidePanel = ({ isOpen, onClose, responses }: FusionSidePanelProps) => {
  if (!isOpen) return null;

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'bg-fusion-openai text-white';
      case 'claude':
        return 'bg-fusion-claude text-white';
      case 'google':
        return 'bg-fusion-google text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div 
      className={cn(
        "fixed right-0 top-0 h-screen w-[680px] bg-white/95 backdrop-blur-sm border-l border-gray-200 shadow-xl",
        "transform transition-all duration-300 ease-in-out z-40"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl rotate-3 flex items-center justify-center bg-gradient-to-br from-fusion-primary to-fusion-secondary text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Fusion Mode</h2>
            <p className="text-sm text-gray-500">Real-time provider responses</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="hover:bg-gray-100 rounded-xl"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4 h-[calc(100vh-72px)]">
        <div className="space-y-4 max-w-3xl mx-auto">
          {responses.map((response, index) => (
            <div
              key={index}
              className="rounded-xl border bg-white/50 backdrop-blur-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md hover:bg-white/80"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  getProviderColor(response.provider)
                )}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{response.provider}</span>
                    {response.timestamp && (
                      <span className="text-xs text-gray-400">
                        {response.timestamp}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">({response.role})</span>
                </div>
              </div>
              <div className="pl-11">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {response.response}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FusionSidePanel;