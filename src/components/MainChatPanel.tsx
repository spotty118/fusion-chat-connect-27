import React from 'react';
import ChatContainer from './ChatContainer';
import ChatInput from './ChatInput';

interface MainChatPanelProps {
  messages: any[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const MainChatPanel = ({ messages, isLoading, onSendMessage, inputRef }: MainChatPanelProps) => {
  return (
    <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-gray-100 min-w-[500px]">
      <ChatContainer messages={messages} isLoading={isLoading} />
      <ChatInput ref={inputRef} onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default MainChatPanel;