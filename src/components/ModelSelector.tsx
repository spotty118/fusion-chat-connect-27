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
  if (!apiKey) return [];

  switch (provider) {
    case 'openai':
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        // Filter to only include GPT-4 models
        return data.data
          .filter((model: any) => model.id.includes('gpt-4'))
          .map((model: any) => model.id);
      } catch (error) {
        console.error('Error fetching OpenAI models:', error);
        return ['gpt-4o', 'gpt-4o-mini']; // Fallback to default models
      }

    case 'claude':
      try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        return data.models.map((model: any) => model.id);
      } catch (error) {
        console.error('Error fetching Claude models:', error);
        return ['claude-2', 'claude-instant']; // Fallback to default models
      }

    case 'google':
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        return data.models
          .filter((model: any) => model.name.includes('palm'))
          .map((model: any) => model.name);
      } catch (error) {
        console.error('Error fetching Google models:', error);
        return ['palm-2']; // Fallback to default models
      }

    case 'openrouter':
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