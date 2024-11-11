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
    <div className="flex space-x-2 px-4 py-3">
      <div className="w-2.5 h-2.5 bg-fusion-primary/60 rounded-full animate-typing-dot-1"></div>
      <div className="w-2.5 h-2.5 bg-fusion-primary/60 rounded-full animate-typing-dot-2"></div>
      <div className="w-2.5 h-2.5 bg-fusion-primary/60 rounded-full animate-typing-dot-3"></div>
    </div>
  );

  return (
    <div className={cn(
      "flex w-full group items-start gap-4 transition-transform duration-200 ease-in-out hover:scale-[1.01]",
      isAI ? "justify-start" : "justify-end"
    )}>
      {isAI && (
        <div className="w-12 h-12 rounded-2xl rotate-3 flex items-center justify-center bg-gradient-to-br from-fusion-primary to-fusion-secondary text-white shadow-lg shadow-fusion-primary/20 ring-2 ring-white transform group-hover:rotate-6 transition-all duration-300">
          <Bot size={24} />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] rounded-3xl px-6 py-4 shadow-lg transition-all duration-300",
        isAI 
          ? "bg-white text-gray-800 rounded-tl-lg border border-gray-100 hover:shadow-xl" 
          : "bg-gradient-to-br from-fusion-primary to-fusion-secondary text-white rounded-tr-lg hover:shadow-fusion-primary/30",
        isAI ? "shadow-lg shadow-gray-100/50" : "shadow-lg shadow-fusion-primary/20"
      )}>
        {isAI && isLoading ? <TypingIndicator /> : (
          <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
            {messageContent}
          </p>
        )}
      </div>
      {!isAI && (
        <div className="w-12 h-12 rounded-2xl -rotate-3 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-fusion-primary shadow-lg shadow-gray-200/50 ring-2 ring-white transform group-hover:-rotate-6 transition-all duration-300">
          <UserCircle2 size={24} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;