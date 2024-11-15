import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Key } from "lucide-react";

export const ManualApiSettings = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('manualApiKey') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('manualModel') || '');

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('manualApiKey', apiKey);
    } else {
      localStorage.removeItem('manualApiKey');
    }
  }, [apiKey]);

  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('manualModel', selectedModel);
    } else {
      localStorage.removeItem('manualModel');
    }
  }, [selectedModel]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    toast({
      title: value ? "API Key Saved" : "API Key Removed",
      description: value ? "Your API key has been saved" : "Your API key has been removed",
    });
  };

  const handleModelSelect = (value: string) => {
    setSelectedModel(value);
    toast({
      title: "Model Selected",
      description: `Selected model: ${value}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Key className="h-5 w-5" />
        <Label>Manual API Configuration</Label>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">OpenAI API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Enter your OpenAI API key..."
          />
          <p className="text-sm text-muted-foreground">
            Used as fallback when Window AI extension is not available
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={selectedModel} onValueChange={handleModelSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};