import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ApiKeyTools = () => {
  const { toast } = useToast();

  const exportApiKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, api_key')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'api-keys.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "API Keys Exported",
        description: "Your API keys have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export API keys. Please try again.",
        variant: "destructive",
      });
    }
  };

  const importApiKeys = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        const text = await file.text();
        const keys = JSON.parse(text);

        for (const key of keys) {
          const { error } = await supabase
            .from('api_keys')
            .update({ api_key: key.api_key })
            .match({ user_id: session.user.id, provider: key.provider });

          if (error) throw error;
        }

        toast({
          title: "API Keys Imported",
          description: "Your API keys have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import API keys. Please check the file format.",
          variant: "destructive",
        });
      }
    };

    input.click();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">API Key Management</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={exportApiKeys}
        >
          <Download className="h-4 w-4" />
          Export API Keys
        </Button>
        
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={importApiKeys}
        >
          <Upload className="h-4 w-4" />
          Import API Keys
        </Button>
      </div>
    </Card>
  );
};