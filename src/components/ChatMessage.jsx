import React from 'react';
import { cn } from '@/lib/utils';

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
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-typing-dot-1"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-typing-dot-2"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-typing-dot-3"></div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full mb-4 group",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-[20px] px-4 py-2 shadow-sm transition-all",
          isAI 
            ? "bg-gray-100 text-gray-800 rounded-tl-sm" 
            : "bg-gradient-to-r from-fusion-primary to-fusion-secondary text-white rounded-tr-sm",
          "transform hover:scale-[1.02] transition-transform duration-200"
        )}
      >
        {isAI && isLoading ? <TypingIndicator /> : (
          <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
            {messageContent}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;