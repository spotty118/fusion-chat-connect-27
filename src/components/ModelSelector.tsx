import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/components/ui/use-toast";
import { fetchModelsFromBackend } from '../api/modelsApi';

interface ModelSelectorProps {
  provider: 'openai' | 'claude' | 'google' | 'openrouter';
  apiKey: string;
  onModelSelect: (model: string) => void;
  selectedModel?: string;
  fusionMode?: boolean;
}

export const ModelSelector = ({
  provider,
  apiKey,
  onModelSelect,
  selectedModel,
  fusionMode = false,
}: ModelSelectorProps) => {
  const { toast } = useToast();
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models', provider, apiKey, fusionMode],
    queryFn: () => fetchModelsFromBackend(provider, apiKey),
    enabled: !!apiKey && !isLoading, // Only fetch when API key is present and not already loading
    retry: 1,
    gcTime: 0,
    staleTime: 30000,
    meta: {
      onError: (error: Error) => {
        toast({
          title: `Error fetching ${provider} models`,
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const handleModelSelect = (value: string) => {
    onModelSelect(value);
    localStorage.setItem(`${provider}_model`, value);
  };

  return (
    <Select
      disabled={isLoading || !apiKey}
      value={selectedModel}
      onValueChange={handleModelSelect}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={apiKey ? "Select a model" : "Enter API key first"} />
      </SelectTrigger>
      <SelectContent>
        {models?.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};