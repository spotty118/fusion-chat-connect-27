import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Bot } from 'lucide-react';

const ChatContainer = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-gray-400">
          <div className="w-20 h-20 rounded-3xl rotate-6 flex items-center justify-center bg-gradient-to-br from-fusion-primary/10 to-fusion-secondary/10 text-fusion-primary animate-pulse">
            <Bot size={40} />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xl font-semibold text-gray-700">Welcome to Fusion Chat</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Start a conversation with AI models and experience the power of unified chat intelligence
            </p>
          </div>
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
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

export default ChatContainer;