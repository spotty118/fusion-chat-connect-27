import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';

const ChatInput = forwardRef(({ onSendMessage, disabled }, ref) => {
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 p-6 border-t bg-white/90 backdrop-blur-xl sticky bottom-0 shadow-lg shadow-black/[0.03]">
      <div className="relative flex-1 group">
        <Input
          ref={ref}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message... (⌘ + Enter to send)"
          disabled={disabled}
          className="flex-1 rounded-2xl border-gray-200 focus:border-fusion-primary focus:ring-fusion-primary bg-gray-50/50 px-6 py-6 text-[15px] shadow-inner transition-all duration-200 hover:bg-gray-100/50 pr-12"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Sparkles className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={disabled || !message.trim()}
        className="rounded-2xl bg-gradient-to-br from-fusion-primary to-fusion-secondary hover:opacity-90 transition-all duration-300 px-8 shadow-lg shadow-fusion-primary/20 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;