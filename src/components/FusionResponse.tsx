import React from 'react';
import { Bot, Sparkles, Brain, Tag } from 'lucide-react';
import { Badge } from './ui/badge';
import { CodeBlock } from './chat/CodeBlock';

interface FusionResponseProps {
  response: {
    final: string;
    providers: Array<{
      provider: string;
      role: string;
      response: string;
    }>;
    analysis?: {
      category: string;
      topics: string[];
      confidence: number;
    };
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
      
      {response.analysis && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Brain className="h-4 w-4" />
          <span className="capitalize">{response.analysis.category}</span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {response.analysis.topics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="prose prose-sm max-w-none">
        {renderContent(response.final)}
      </div>
    </div>
  );
};

export default FusionResponse;