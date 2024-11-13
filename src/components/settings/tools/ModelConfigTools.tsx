import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const ModelConfigTools = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refreshModels = async () => {
    await queryClient.invalidateQueries({ queryKey: ['models'] });
    toast({
      title: "Models Refreshed",
      description: "Available models have been refreshed for all providers.",
    });
  };

  const resetModelPreferences = () => {
    localStorage.removeItem('openai_model');
    localStorage.removeItem('claude_model');
    localStorage.removeItem('google_model');
    localStorage.removeItem('openrouter_model');
    
    toast({
      title: "Model Preferences Reset",
      description: "Your model preferences have been reset to default.",
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Model Configuration Tools</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={refreshModels}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Models
        </Button>
        
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={resetModelPreferences}
        >
          <Settings2 className="h-4 w-4" />
          Reset Preferences
        </Button>
      </div>
    </Card>
  );
};