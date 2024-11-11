import React from 'react';
import { cn } from '@/lib/utils';
import { UserCircle2, Bot } from 'lucide-react';

const ChatMessage = ({ message, isAI, isLoading }) => {
  const getMessageContent = (msg) => {
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
      if (msg.text) return msg.text;
      return JSON.stringify(msg, null, 2);
    }
    return String(msg);
  };

  const messageContent = getMessageContent(message);

  const TypingIndicator = () => (
    <div className="flex space-x-1 px-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-1"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-2"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-3"></div>
    </div>
  );

  return (
    <div className={cn(
      "flex w-full mb-6 group items-start gap-3",
      isAI ? "justify-start" : "justify-end"
    )}>
      {isAI && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-fusion-primary text-white">
          <Bot size={18} />
        </div>
      )}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
        isAI 
          ? "bg-gray-100 text-gray-800 rounded-tl-sm" 
          : "bg-gradient-to-r from-fusion-primary to-fusion-secondary text-white rounded-tr-sm",
        "transform hover:scale-[1.01] transition-all duration-200"
      )}>
        {isAI && isLoading ? <TypingIndicator /> : (
          <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
            {messageContent}
          </p>
        )}
      </div>
      {!isAI && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
          <UserCircle2 size={18} className="text-gray-600" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;