import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Key } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ManualApiSettings = () => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState(() => localStorage.getItem('manualProvider') || 'openai');
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

  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem('manualProvider', selectedProvider);
      // Reset model when provider changes
      setSelectedModel('');
    } else {
      localStorage.removeItem('manualProvider');
    }
  }, [selectedProvider]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    toast({
      title: value ? "API Key Saved" : "API Key Removed",
      description: value ? "Your API key has been saved" : "Your API key has been removed",
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
          <Label htmlFor="provider">Provider</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="google">Google PaLM</SelectItem>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">{selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder={`Enter your ${selectedProvider} API key...`}
          />
          <p className="text-sm text-muted-foreground">
            Used as fallback when Window AI extension is not available
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <ModelSelector
            provider={selectedProvider as 'openai' | 'claude' | 'google' | 'openrouter'}
            apiKey={apiKey}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
};