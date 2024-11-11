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

const fetchModels = async (
  provider: string,
  apiKey: string,
  fusionMode: boolean = false
): Promise<string[]> => {
  // For providers requiring backend proxy
  if (provider === 'claude' || provider === 'openai' || provider === 'google') {
    return await fetchModelsFromBackend(provider, apiKey);
  }

  // If Window.ai is available and fusion mode is not active, try using it
  if (!fusionMode && typeof window !== 'undefined' && window.ai?.getModels) {
    try {
      const windowAiModels = await window.ai.getModels();
      if (Array.isArray(windowAiModels) && windowAiModels.length > 0) {
        return windowAiModels.map((modelId) => 
          modelId.includes('/') ? modelId : `${provider}/${modelId}`
        ).filter(Boolean);
      }
    } catch (error) {
      console.error('Error fetching models from Window.ai:', error);
    }
  }

  // Handle OpenRouter separately as it supports CORS
  if (provider === 'openrouter' && apiKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OpenRouter models');
      }

      const data = await response.json();
      return data.data.map((model: { id: string }) => model.id);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return await fetchModelsFromBackend(provider, apiKey);
    }
  }

  // If all else fails, fetch from backend
  return await fetchModelsFromBackend(provider, apiKey);
};

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
    queryFn: () => fetchModels(provider, apiKey, fusionMode),
    enabled: true,
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

  return (
    <Select
      disabled={isLoading}
      value={selectedModel}
      onValueChange={onModelSelect}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};