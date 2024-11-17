import React from 'react';
import ChatContainer from './ChatContainer';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';
import type { ResponseType } from './ResponseTypeSelector';

interface Message {
  role: string;
  content: string;
}

interface MainChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, responseType: ResponseType) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const MainChatPanel = ({ messages, isLoading, onSendMessage, inputRef }: MainChatPanelProps) => {
  return (
    <div className={cn(
      "flex-1 flex flex-col bg-white/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20",
      "max-w-4xl mx-auto w-full transition-all duration-300 hover:shadow-3xl hover:border-white/30"
    )}>
      <ChatContainer messages={messages} isLoading={isLoading} />
      <ChatInput ref={inputRef} onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default MainChatPanel;