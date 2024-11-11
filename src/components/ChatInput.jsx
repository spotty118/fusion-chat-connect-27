import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 p-6 border-t bg-white/80 backdrop-blur-xl sticky bottom-0 shadow-lg shadow-black/[0.03]">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 rounded-2xl border-gray-200 focus:border-fusion-primary focus:ring-fusion-primary bg-gray-50/50 px-6 py-6 text-[15px] shadow-inner"
      />
      <Button 
        type="submit" 
        disabled={disabled || !message.trim()}
        className="rounded-2xl bg-gradient-to-br from-fusion-primary to-fusion-secondary hover:opacity-90 transition-all duration-200 px-8 shadow-lg shadow-fusion-primary/20"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default ChatInput;