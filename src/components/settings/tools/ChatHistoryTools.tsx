import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ChatHistoryTools = () => {
  const { toast } = useToast();

  const clearHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast({
        title: "Chat History Cleared",
        description: "Your chat history has been cleared successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const historyJson = JSON.stringify(data, null, 2);
      const blob = new Blob([historyJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chat-history.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Chat History Downloaded",
        description: "Your chat history has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Chat History Tools</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={downloadHistory}
        >
          <Download className="h-4 w-4" />
          Download History
        </Button>
        
        <Button
          variant="destructive"
          className="w-full flex items-center gap-2"
          onClick={clearHistory}
        >
          <Trash2 className="h-4 w-4" />
          Clear History
        </Button>
      </div>
    </Card>
  );
};