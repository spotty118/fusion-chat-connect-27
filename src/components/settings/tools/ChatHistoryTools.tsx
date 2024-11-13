import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Download, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const ChatHistoryTools = () => {
  const { toast } = useToast();

  const clearHistory = () => {
    localStorage.removeItem('chatHistory');
    toast({
      title: "Chat History Cleared",
      description: "Your chat history has been cleared successfully.",
    });
  };

  const downloadHistory = () => {
    const history = localStorage.getItem('chatHistory');
    const blob = new Blob([history || ''], { type: 'application/json' });
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