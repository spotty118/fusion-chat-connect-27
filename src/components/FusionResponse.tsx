import React from 'react';
import { Bot } from 'lucide-react';

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
      <div className="flex items-center gap-2 text-fusion-primary">
        <Bot className="h-5 w-5" />
        <span className="font-medium">Fusion Response</span>
      </div>
      <div className="prose prose-sm max-w-none">
        {response.final}
      </div>
    </div>
  );
};

export default FusionResponse;