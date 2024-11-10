import React from 'react';
import { cn } from '@/lib/utils';

const ChatMessage = ({ message, isAI }) => {
  const getMessageContent = (msg) => {
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
      if (msg.text) return msg.text;
      return JSON.stringify(msg, null, 2);
    }
    return String(msg);
  };

  const messageContent = getMessageContent(message);

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-message-in group",
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
        <p className={cn(
          "text-sm md:text-base leading-relaxed",
          isAI ? "typing-animation" : "whitespace-pre-wrap"
        )}>
          {messageContent}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;