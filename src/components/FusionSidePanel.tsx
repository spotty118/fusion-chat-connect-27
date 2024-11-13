import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Zap } from 'lucide-react';
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
      case 'openai': return 'bg-fusion-openai text-white';
      case 'claude': return 'bg-fusion-claude text-white';
      case 'google': return 'bg-fusion-google text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-gray-100 min-w-[500px]">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-br from-fusion-primary/10 to-fusion-secondary/10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl rotate-3 flex items-center justify-center bg-gradient-to-br from-fusion-primary to-fusion-secondary text-white shadow-lg shadow-fusion-primary/20">
              <Zap className="h-6 w-6 animate-electric-surge" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-white shadow-md flex items-center justify-center">
              <Bot className="h-3 w-3 text-fusion-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-fusion-primary to-fusion-secondary bg-clip-text text-transparent">Fusion Mode</h2>
            <p className="text-sm text-gray-500">Real-time provider responses</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div key={index} className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <div className={cn("w-10 h-10 rounded-xl rotate-2 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-300", getProviderColor(response.provider))}>
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{response.provider}</span>
                    {response.timestamp && <span className="text-xs text-gray-400">{response.timestamp}</span>}
                  </div>
                  <span className="text-sm text-gray-500">({response.role})</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-b from-white to-gray-50/30">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{response.response}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FusionSidePanel;