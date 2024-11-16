import React from 'react';
import { cn } from '@/lib/utils';
import { UserCircle2, Bot, MessageSquareQuote, Sparkles } from 'lucide-react';
import { CodeBlock } from './chat/CodeBlock';
import { Button } from '@/components/ui/button';
import FusionResponse from './FusionResponse';

const ChatMessage = ({ message, isAI, isLoading, onReply }) => {
  const getMessageContent = (msg) => {
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
      if (msg.final && msg.providers) {
        return <FusionResponse response={msg} />;
      }
      if (msg.text) return msg.text;
      return JSON.stringify(msg, null, 2);
    }
    return String(msg);
  };

  const messageContent = getMessageContent(message);

  // Function to detect and parse code blocks
  const renderContent = (content) => {
    if (React.isValidElement(content)) {
      return content;
    }

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

  const TypingIndicator = () => (
    <div className="flex space-x-2 px-4 py-3">
      <div className="w-2.5 h-2.5 bg-fusion-primary/60 rounded-full animate-typing-dot-1"></div>
      <div className="w-2.5 h-2.5 bg-fusion-primary/60 rounded-full animate-typing-dot-2"></div>
      <div className="w-2.5 h-2.5 bg-fusion-primary/60 rounded-full animate-typing-dot-3"></div>
    </div>
  );

  return (
    <div className={cn(
      "flex w-full group items-start gap-4 transition-all duration-300 ease-in-out hover:scale-[1.01]",
      isAI ? "justify-start" : "justify-end"
    )}>
      {isAI && (
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl rotate-3 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20 ring-2 ring-white transform group-hover:rotate-6 transition-all duration-300">
            <Bot size={24} />
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 rounded-lg bg-white shadow-md flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-yellow-400" />
            </div>
          </div>
        </div>
      )}
      <div className={cn(
        "relative max-w-[85%] rounded-3xl px-6 py-4 transition-all duration-300 group animate-fade-in glass-effect",
        isAI 
          ? "bg-white/80 text-gray-800 rounded-tl-lg border border-white/20" 
          : "bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-tr-lg",
        isAI ? "shadow-lg shadow-gray-100/50" : "shadow-lg shadow-blue-500/20"
      )}>
        {isAI && isLoading ? <TypingIndicator /> : (
          <>
            <div className="text-[15px] leading-relaxed">
              {renderContent(messageContent)}
            </div>
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/20 rounded-xl"
                onClick={() => onReply?.(messageContent)}
              >
                <MessageSquareQuote className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      {!isAI && (
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl -rotate-3 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-blue-500 shadow-lg shadow-gray-200/50 ring-2 ring-white transform group-hover:-rotate-6 transition-all duration-300">
            <UserCircle2 size={24} />
          </div>
          <div className="absolute -bottom-1 -left-1">
            <div className="w-4 h-4 rounded-lg bg-white shadow-md flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;