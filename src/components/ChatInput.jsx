import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, X } from 'lucide-react';
import { supportsFileAttachments } from '@/utils/fileSupport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ChatInput = forwardRef(({ onSendMessage, disabled }, ref) => {
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  
  const currentProvider = localStorage.getItem('manualProvider') || 'openai';
  const currentModel = localStorage.getItem(`${currentProvider}_model`) || '';
  
  const { data: showAttachments = false, isLoading } = useQuery({
    queryKey: ['file-support', currentProvider, currentModel],
    queryFn: () => supportsFileAttachments(currentProvider, currentModel),
    enabled: !!currentProvider && !!currentModel,
    staleTime: 30000,
    retry: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setUploadedFile(null);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const session = await supabase.auth.getSession();
        const userId = session?.data?.session?.user?.id;

        if (!userId) {
          throw new Error('User not authenticated');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        const response = await fetch('/functions/v1/upload-temp-file', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const data = await response.json();
        setUploadedFile({
          name: data.filename,
          url: data.publicUrl
        });

        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully.",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        {uploadedFile && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate">{uploadedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-xl ${
              showAttachments && !isLoading
                ? "hover:bg-gray-100 text-gray-700" 
                : "opacity-50 cursor-not-allowed text-gray-400"
            }`}
            disabled={!showAttachments || disabled || isLoading || isUploading}
            onClick={handleFileClick}
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
            disabled={disabled || isUploading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-xl bg-fusion-primary hover:bg-fusion-primary/90"
            disabled={disabled || !message.trim() || isUploading}
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