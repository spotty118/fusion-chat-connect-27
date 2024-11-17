import React from 'react';
import { Bot, Sparkles, Brain, Tag } from 'lucide-react';
import { Badge } from './ui/badge';
import { CodeBlock } from './chat/CodeBlock';

interface FusionResponseProps {
  response: {
    providers: Array<{
      provider: string;
      content: string;
      timestamp: string;
    }>;
    final: string;
  };
  isLoading?: boolean;
  error?: string;
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

  return (
    <div className="space-y-4">
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

      {response.providers.map((provider, index) => (
        <div key={index} className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4" />
            <span className="font-medium">{provider.provider.toUpperCase()}</span>
            <span className="text-sm text-muted-foreground">
              {new Date(provider.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            {renderContent(provider.content)}
          </div>
        </div>
      ))}

      <div className="prose prose-sm max-w-none">
        {renderContent(response.final)}
      </div>
    </div>
  );
};

export default FusionResponse;