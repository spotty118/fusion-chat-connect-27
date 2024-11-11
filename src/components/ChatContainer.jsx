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
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-gradient-to-b from-gray-50/50 to-white/50">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
          <div className="w-24 h-24 rounded-3xl rotate-6 flex items-center justify-center bg-gradient-to-br from-fusion-primary/10 to-fusion-secondary/10 text-fusion-primary animate-pulse transform hover:rotate-12 transition-all duration-500">
            <Bot size={48} />
          </div>
          <div className="space-y-3 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-fusion-primary to-fusion-secondary">
              Welcome to ThinkLink
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Experience the power of unified chat intelligence. Start a conversation with AI models and discover new possibilities.
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