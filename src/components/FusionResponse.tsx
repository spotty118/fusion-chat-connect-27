import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface FusionResponseProps {
  response: {
    final: string;
    providers: Array<{
      provider: string;
      role: string;
      response: string;
    }>;
  };
}

const FusionResponse = ({ response }: FusionResponseProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-xl rotate-3 flex items-center justify-center bg-gradient-to-br from-fusion-primary to-fusion-secondary text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <Sparkles className="h-2 w-2 text-yellow-400" />
            </div>
          </div>
        </div>
        <span className="font-medium bg-gradient-to-r from-fusion-primary to-fusion-secondary bg-clip-text text-transparent">
          Fusion Response
        </span>
      </div>
      <div className="prose prose-sm max-w-none">
        {response.final}
      </div>
    </div>
  );
};

export default FusionResponse;