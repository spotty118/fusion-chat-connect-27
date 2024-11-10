import React from 'react';
import { cn } from '@/lib/utils';

const ChatMessage = ({ message, isAI }) => {
  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-message-in",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
          isAI
            ? "bg-white text-gray-800"
            : "bg-gradient-to-r from-fusion-primary to-fusion-secondary text-white"
        )}
      >
        <p className="text-sm md:text-base">{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;