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
  openrouter: ['openrouter/auto', 'mistralai/mixtral-8x7b-instruct', 'anthropic/claude-2']
};

interface WindowAIModel {
  id: string;
  provider?: string;
  name?: string;
}

const isWindowAIModel = (model: unknown): model is WindowAIModel => {
  if (typeof model !== 'object' || model === null) return false;
  const windowModel = model as WindowAIModel;
  return typeof windowModel.id === 'string';
};

const fetchModels = async (provider: string, apiKey: string): Promise<string[]> => {
  if (typeof window !== 'undefined' && window.ai?.getModels) {
    try {
      const windowAiModels = await window.ai.getModels();
      console.log('Available Window.ai models:', windowAiModels);
      
      if (Array.isArray(windowAiModels) && windowAiModels.length > 0) {
        const formattedModels = windowAiModels
          .filter(isWindowAIModel)
          .map((model: WindowAIModel) => {
            return model.provider ? `${model.provider}/${model.id}` : `${provider}/${model.id}`;
          })
          .filter(Boolean);

        if (formattedModels.length > 0) {
          console.log('Formatted Window.ai models:', formattedModels);
          return formattedModels;
        }
      }
    } catch (error) {
      console.error('Error fetching models from Window.ai:', error);
    }
  }

  // For Claude, always return default models due to CORS restrictions
  if (provider === 'claude') {
    return DEFAULT_MODELS.claude;
  }

  // If Window.ai fails or returns no models, fall back to API endpoints
  if (!apiKey && provider !== 'openrouter') {
    throw new Error('API key is required');
  }

  // Fallback to OpenRouter API for OpenRouter provider
  if (provider === 'openrouter') {
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
      return data.data.map((model: { id: string }) => model.id).filter(Boolean);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return DEFAULT_MODELS.openrouter;
    }
  }

  // Fallback to other provider APIs
  const endpoints = {
    openai: 'https://api.openai.com/v1/models',
    google: 'https://generativelanguage.googleapis.com/v1beta/models',
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  try {
    const response = await fetch(endpoints[provider], { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Failed to fetch ${provider} models`);
    }

    switch (provider) {
      case 'openai':
        return data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => model.id);
      case 'google':
        return data.models
          .filter((model: any) => model.name.includes('palm'))
          .map((model: any) => model.name);
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
    enabled: true,
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
