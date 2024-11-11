import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

const ChatContainer = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400">
          <div className="w-16 h-16 rounded-3xl rotate-6 flex items-center justify-center bg-gradient-to-br from-fusion-primary/10 to-fusion-secondary/10 text-fusion-primary">
            <Bot size={32} />
          </div>
          <p className="text-lg font-light">Start a conversation...</p>
        </div>
      )}
      {messages.map((msg, index) => (
        <ChatMessage
          key={index}
          message={msg.content}
          isAI={msg.role === 'assistant'}
          isLoading={isLoading && index === messages.length - 1}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;