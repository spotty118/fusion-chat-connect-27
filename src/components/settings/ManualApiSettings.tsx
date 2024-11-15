import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Key } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const ManualApiSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState(() => localStorage.getItem('manualProvider') || 'openai');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(`${selectedProvider}_key`) || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(`${selectedProvider}_model`) || '');

  // Update API key in localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(`${selectedProvider}_key`, apiKey);
    } else {
      localStorage.removeItem(`${selectedProvider}_key`);
    }
  }, [apiKey, selectedProvider]);

  // Update selected model in localStorage when it changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(`${selectedProvider}_model`, selectedModel);
    } else {
      localStorage.removeItem(`${selectedProvider}_model`);
    }
  }, [selectedModel, selectedProvider]);

  // Handle provider change
  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem('manualProvider', selectedProvider);
      // Load the stored API key for the selected provider
      const storedKey = localStorage.getItem(`${selectedProvider}_key`) || '';
      setApiKey(storedKey);
      // Load the stored model for the selected provider
      const storedModel = localStorage.getItem(`${selectedProvider}_model`) || '';
      setSelectedModel(storedModel);
    } else {
      localStorage.removeItem('manualProvider');
    }
  }, [selectedProvider]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    // Reset selected model when API key changes
    setSelectedModel('');
    // Invalidate the models query to trigger a refresh
    queryClient.invalidateQueries({ queryKey: ['models', selectedProvider] });
    
    toast({
      title: value ? "API Key Saved" : "API Key Removed",
      description: value 
        ? `Your ${selectedProvider} API key has been saved` 
        : `Your ${selectedProvider} API key has been removed`,
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