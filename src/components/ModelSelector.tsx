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

const fetchModels = async (provider: string, apiKey: string) => {
  if (!apiKey) return [];

  const handleApiError = (error: any, defaultModels: string[]) => {
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your credentials.');
    }
    console.error(`Error fetching ${provider} models:`, error);
    return defaultModels;
  };

  switch (provider) {
    case 'openai':
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          const error = await response.json();
          throw { status: response.status, message: error.error?.message };
        }
        const data = await response.json();
        return data.data
          .filter((model: any) => model.id.includes('gpt-4'))
          .map((model: any) => model.id);
      } catch (error) {
        return handleApiError(error, ['gpt-4', 'gpt-4-turbo-preview']);
      }

    case 'claude':
      try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          throw { status: response.status };
        }
        const data = await response.json();
        return data.models.map((model: any) => model.id);
      } catch (error) {
        return handleApiError(error, ['claude-2', 'claude-instant']);
      }

    case 'google':
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          throw { status: response.status };
        }
        const data = await response.json();
        return data.models
          .filter((model: any) => model.name.includes('palm'))
          .map((model: any) => model.name);
      } catch (error) {
        return handleApiError(error, ['palm-2']);
      }

    case 'openrouter':
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          }
        });
        if (!response.ok) {
          throw { status: response.status };
        }
        const data = await response.json();
        return data.data.map((model: any) => model.id);
      } catch (error) {
        return handleApiError(error, []);
      }

    default:
      return [];
  }
};

export const ModelSelector = ({ provider, apiKey, onModelSelect, selectedModel }: ModelSelectorProps) => {
  const { toast } = useToast();
  const { data: models = [], isLoading, error } = useQuery({
    queryKey: ['models', provider, apiKey],
    queryFn: () => fetchModels(provider, apiKey),
    enabled: !!apiKey,
    onError: (error: Error) => {
      toast({
        title: "Error fetching models",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Select
      disabled={isLoading || !apiKey}
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