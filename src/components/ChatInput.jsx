import React, { forwardRef, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, X, Code, FileText, Image, BarChart } from 'lucide-react';
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
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Upload file directly to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('temp_uploads')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('temp_uploads')
          .getPublicUrl(filePath);

        // Store file metadata in the database with explicit user_id
        const { error: dbError } = await supabase
          .from('temp_files')
          .insert({
            user_id: userId, // Explicitly set the user_id
            filename: file.name,
            file_path: filePath,
            content_type: file.type,
            size: file.size,
          });

        if (dbError) {
          throw dbError;
        }

        setUploadedFile({
          name: file.name,
          url: publicUrl
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ToolButton = ({ icon: Icon, label }) => (
    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 rounded-full hover:bg-gray-100"
      title={label}
    >
      <Icon className="h-4 w-4 text-gray-500" />
    </Button>
  );

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
        <div className="flex items-center gap-2 bg-white border rounded-full p-2">
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
            className={`h-8 w-8 rounded-full ${
              showAttachments && !isLoading
                ? "hover:bg-gray-100 text-gray-700" 
                : "opacity-50 cursor-not-allowed text-gray-400"
            }`}
            disabled={!showAttachments || disabled || isLoading || isUploading}
            onClick={handleFileClick}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={ref}
            type="text"
            placeholder="Message multiple AIs..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={disabled || isUploading}
          />
          <div className="flex items-center gap-2 mr-2">
            <ToolButton icon={Code} label="Code" />
            <ToolButton icon={FileText} label="Document" />
            <ToolButton icon={Image} label="Image" />
            <ToolButton icon={BarChart} label="Data" />
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-r from-fusion-primary to-fusion-secondary hover:opacity-90"
            disabled={disabled || !message.trim() || isUploading}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
