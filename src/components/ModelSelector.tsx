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

interface ModelSelectorProps {
  provider: 'openai' | 'claude' | 'google' | 'openrouter';
  apiKey: string;
  onModelSelect: (model: string) => void;
  selectedModel?: string;
}

const DEFAULT_MODELS = {
  openai: ['gpt-4', 'gpt-3.5-turbo'],
  claude: ['claude-2', 'claude-instant'],
  google: ['palm-2'],
  openrouter: ['openai/gpt-4', 'anthropic/claude-2']
};

const fetchModels = async (provider: string, apiKey: string) => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  // For Window.ai integration
  if (typeof window !== 'undefined' && window.ai?.getModels) {
    try {
      const models = await window.ai.getModels();
      return models;
    } catch (error) {
      console.error('Error fetching models from Window.ai:', error);
      return DEFAULT_MODELS[provider] || [];
    }
  }

  // Fallback to API endpoints if Window.ai is not available
  const endpoints = {
    openai: 'https://api.openai.com/v1/models',
    claude: 'https://api.anthropic.com/v1/models',
    google: 'https://generativelanguage.googleapis.com/v1beta/models',
    openrouter: 'https://openrouter.ai/api/v1/models',
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider === 'claude') {
    headers['x-api-key'] = apiKey;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(endpoints[provider], { headers });
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || `Failed to fetch ${provider} models`;
      throw new Error(errorMessage);
    }

    switch (provider) {
      case 'openai':
        return data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => model.id);
      case 'claude':
        return data.models.map((model: any) => model.id);
      case 'google':
        return data.models
          .filter((model: any) => model.name.includes('palm'))
          .map((model: any) => model.name);
      case 'openrouter':
        return data.data.map((model: any) => model.id);
      default:
        return DEFAULT_MODELS[provider] || [];
    }
  } catch (error: any) {
    console.error(`Error fetching ${provider} models:`, error);
    return DEFAULT_MODELS[provider] || [];
  }
};

export const ModelSelector = ({ provider, apiKey, onModelSelect, selectedModel }: ModelSelectorProps) => {
  const { toast } = useToast();
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models', provider, apiKey],
    queryFn: () => fetchModels(provider, apiKey),
    enabled: !!apiKey || (typeof window !== 'undefined' && !!window.ai?.getModels),
    retry: false,
    gcTime: 0,
    staleTime: 30000,
    meta: {
      errorHandler: (error: Error) => {
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