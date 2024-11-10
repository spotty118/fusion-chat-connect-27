import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';

interface ModelSelectorProps {
  provider: 'openai' | 'claude' | 'google' | 'openrouter';
  apiKey: string;
  onModelSelect: (model: string) => void;
  selectedModel?: string;
}

const fetchModels = async (provider: string, apiKey: string) => {
  if (provider === 'openrouter') {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }

  // This is a placeholder implementation for other providers
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini'];
    case 'claude':
      return ['claude-2', 'claude-instant'];
    case 'google':
      return ['palm-2'];
    default:
      return [];
  }
};

export const ModelSelector = ({ provider, apiKey, onModelSelect, selectedModel }: ModelSelectorProps) => {
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models', provider, apiKey],
    queryFn: () => fetchModels(provider, apiKey),
    enabled: !!apiKey,
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