import React, { forwardRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip } from 'lucide-react';
import { supportsFileAttachments } from '@/utils/fileSupport';
import { useQuery } from '@tanstack/react-query';

const ChatInput = forwardRef(({ onSendMessage, disabled }, ref) => {
  const [message, setMessage] = useState('');
  
  // Get current provider and model from localStorage
  const currentProvider = localStorage.getItem('manualProvider') || 'openai';
  const currentModel = localStorage.getItem(`${currentProvider}_model`) || '';
  
  // Use React Query to handle the async file support check
  const { data: showAttachments = false, isLoading } = useQuery({
    queryKey: ['file-support', currentProvider, currentModel],
    queryFn: () => supportsFileAttachments(currentProvider, currentModel),
    enabled: !!currentProvider && !!currentModel,
    staleTime: 30000, // Cache the result for 30 seconds
    retry: 1, // Only retry once if the check fails
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-xl ${
              showAttachments && !isLoading
                ? "hover:bg-gray-100 text-gray-700" 
                : "opacity-50 cursor-not-allowed text-gray-400"
            }`}
            disabled={!showAttachments || disabled || isLoading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            ref={ref}
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-xl bg-fusion-primary hover:bg-fusion-primary/90"
            disabled={disabled || !message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;