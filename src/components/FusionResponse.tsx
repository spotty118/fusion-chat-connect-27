import React from 'react';
import { Bot, Sparkles, Brain, Tag, GitCompare } from 'lucide-react';
import { Badge } from './ui/badge';
import { CodeBlock } from './chat/CodeBlock';
import { cn } from '@/lib/utils';

interface FusionResponseProps {
  response: {
    providers: Array<{
      provider: string;
      content: string;
      timestamp: string;
    }>;
    final: string;
  };
}

const FusionResponse = ({ response }: FusionResponseProps) => {
  const renderContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <p key={lastIndex} className="whitespace-pre-wrap">
            {content.slice(lastIndex, match.index)}
          </p>
        );
      }

      // Add code block
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      parts.push(
        <CodeBlock key={match.index} code={code} language={language} />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <p key={lastIndex} className="whitespace-pre-wrap">
          {content.slice(lastIndex)}
        </p>
      );
    }

    return parts;
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-blue-500 text-white';
      case 'claude': return 'bg-purple-500 text-white';
      case 'google': return 'bg-green-500 text-white';
      case 'openrouter': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-fusion-primary" />
          <span className="font-medium">Fusion Response</span>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>{response.providers.length} Providers</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            <span>Synthesized</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {response.providers.map((provider, index) => (
          <div key={index} className="rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className={cn(
                "w-8 h-8 rounded-lg rotate-2 flex items-center justify-center shadow-lg",
                getProviderColor(provider.provider)
              )}>
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{provider.provider.toUpperCase()}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(provider.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 prose prose-sm max-w-none">
              {renderContent(provider.content)}
            </div>
          </div>
        ))}

        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-fusion-primary" />
              <span className="font-medium">Synthesized Response</span>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              <span>Best Elements Combined</span>
            </Badge>
          </div>
          <div className="prose prose-sm max-w-none">
            {renderContent(response.final)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FusionResponse;