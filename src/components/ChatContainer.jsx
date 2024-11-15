import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Bot, Sparkles } from 'lucide-react';

const ChatContainer = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-gradient-to-b from-gray-50/50 via-white/80 to-gray-50/50">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full space-y-8 py-12 animate-fade-in">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl rotate-6 flex items-center justify-center bg-gradient-to-br from-fusion-primary/20 to-fusion-secondary/20 text-fusion-primary animate-pulse transform hover:rotate-12 transition-all duration-500 group">
              <Bot size={52} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="p-2 bg-white rounded-full shadow-lg animate-bounce">
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="space-y-4 text-center max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fusion-primary via-fusion-secondary to-fusion-primary animate-pulse">
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