import React from 'react';
import { cn } from '@/lib/utils';

const ChatMessage = ({ message, isAI }) => {
  // Convert message to string, handling different types of content
  const getMessageContent = (msg) => {
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
      // If it's an object with a text property, use that
      if (msg.text) return msg.text;
      // Otherwise stringify it but make it readable
      return JSON.stringify(msg, null, 2);
    }
    return String(msg);
  };

  const messageContent = getMessageContent(message);

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
        <p className="text-sm md:text-base whitespace-pre-wrap">{messageContent}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
