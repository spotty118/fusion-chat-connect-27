import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ProviderConfig from './ProviderConfig';
import { UseQueryResult } from '@tanstack/react-query';

interface FusionModeSettingsProps {
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  onApiKeyChange: (provider: string) => (value: string) => void;
  onModelSelect: (provider: string) => (model: string) => void;
  providerQueries: Record<string, UseQueryResult<boolean, unknown>>;
  onActivate: () => void;
}

const FusionModeSettings = ({
  apiKeys,
  selectedModels,
  onApiKeyChange,
  onModelSelect,
  providerQueries,
  onActivate
}: FusionModeSettingsProps) => {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      <ProviderConfig
        provider="openai"
        label="OpenAI Configuration"
        bgColor="bg-blue-500"
        apiKey={apiKeys.openai}
        onApiKeyChange={onApiKeyChange('openai')}
        selectedModel={selectedModels.openai}
        onModelSelect={onModelSelect('openai')}
        statusQuery={providerQueries.openai}
      />
      <ProviderConfig
        provider="claude"
        label="Anthropic Claude Configuration"
        bgColor="bg-purple-500"
        apiKey={apiKeys.claude}
        onApiKeyChange={onApiKeyChange('claude')}
        selectedModel={selectedModels.claude}
        onModelSelect={onModelSelect('claude')}
        statusQuery={providerQueries.claude}
      />
      <ProviderConfig
        provider="google"
        label="Google PaLM Configuration"
        bgColor="bg-green-500"
        apiKey={apiKeys.google}
        onApiKeyChange={onApiKeyChange('google')}
        selectedModel={selectedModels.google}
        onModelSelect={onModelSelect('google')}
        statusQuery={providerQueries.google}
      />
      <ProviderConfig
        provider="openrouter"
        label="OpenRouter Configuration"
        bgColor="bg-orange-500"
        apiKey={apiKeys.openrouter}
        onApiKeyChange={onApiKeyChange('openrouter')}
        selectedModel={selectedModels.openrouter}
        onModelSelect={onModelSelect('openrouter')}
        statusQuery={providerQueries.openrouter}
      />

      <Button 
        className="w-full"
        onClick={onActivate}
      >
        Activate Fusion Mode
      </Button>
    </div>
  );
};

export default FusionModeSettings;