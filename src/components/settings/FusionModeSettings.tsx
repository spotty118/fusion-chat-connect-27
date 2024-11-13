import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ProviderConfig from './ProviderConfig';
import { UseQueryResult } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { useFusionMode } from '@/hooks/useFusionMode';

interface FusionModeSettingsProps {
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  onApiKeyChange: (provider: string) => (value: string) => void;
  onModelSelect: (provider: string) => (model: string) => void;
  providerQueries: Record<string, UseQueryResult<boolean, unknown>>;
}

const FusionModeSettings = ({
  apiKeys,
  selectedModels,
  onApiKeyChange,
  onModelSelect,
  providerQueries,
}: FusionModeSettingsProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const { isFusionMode, toggleFusionMode } = useFusionMode();

  const getConfiguredProvidersCount = () => {
    return Object.entries(apiKeys).filter(([provider, key]) => 
      key && key.length > 0 && selectedModels[provider] && selectedModels[provider].length > 0
    ).length;
  };

  const handleActivate = () => {
    if (isFusionMode) {
      // Deactivating fusion mode
      toggleFusionMode();
      toast({
        title: "Fusion Mode Deactivated",
        description: "Switched to single provider mode",
      });
      return;
    }

    const configuredCount = getConfiguredProvidersCount();
    
    if (configuredCount < 3) {
      toast({
        title: "Cannot Activate Fusion Mode",
        description: `At least 3 providers must be configured. Currently configured: ${configuredCount}/4`,
        variant: "destructive",
      });
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      toggleFusionMode();
      toast({
        title: "Fusion Mode Activated",
        description: "Multi-provider mode is now active",
      });
    }, 2000);
  };

  const configuredCount = getConfiguredProvidersCount();
  const isActivatable = !isFusionMode && configuredCount >= 3;

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

      <div className="space-y-2">
        <Button 
          className={`w-full relative overflow-hidden group ${!isActivatable && !isFusionMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleActivate}
          disabled={!isActivatable && !isFusionMode}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isFusionMode ? 'Deactivate' : 'Activate'} Fusion Mode
            <Zap className="w-4 h-4" />
          </span>
        </Button>
        <p className="text-sm text-gray-500 text-center">
          {isFusionMode 
            ? "Multi-provider mode is active" 
            : `${configuredCount}/4 providers configured (${isActivatable ? 'Ready to activate' : `Need ${3 - configuredCount} more`})`}
        </p>
      </div>
    </div>
  );
};

export default FusionModeSettings;