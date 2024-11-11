import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ProviderConfig from './ProviderConfig';
import { UseQueryResult } from '@tanstack/react-query';
import { Zap } from 'lucide-react';

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
  const [isAnimating, setIsAnimating] = useState(false);

  const handleActivate = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onActivate();
    }, 2000); // Match animation duration
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 relative">
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-blue-500/20 animate-electric-surge rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-24 h-24 text-yellow-400 animate-electric-surge" />
          </div>
        </div>
      )}
      
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
        className="w-full relative overflow-hidden group"
        onClick={handleActivate}
        disabled={isAnimating}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Activate Fusion Mode
          <Zap className="w-4 h-4" />
        </span>
      </Button>
    </div>
  );
};

export default FusionModeSettings;