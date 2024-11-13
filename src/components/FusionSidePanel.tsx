import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X } from 'lucide-react';
import { Button } from './ui/button';

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
    <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Fusion Mode Responses</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-64px)] p-4">
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div
              key={index}
              className="rounded-lg border p-4 space-y-2 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getProviderColor(response.provider)}`}>
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium">{response.provider}</span>
                  <span className="text-sm text-gray-500 ml-2">({response.role})</span>
                </div>
                {response.timestamp && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {response.timestamp}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {response.response}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FusionSidePanel;