import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ProviderConfig from './ProviderConfig';
import { UseQueryResult } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { useFusionMode } from '@/hooks/useFusionMode';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>(() => ({
    openai: true,
    claude: true,
    google: true,
    openrouter: true
  }));

  const handleProviderToggle = (provider: string) => {
    setEnabledProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
    localStorage.setItem(`${provider}_enabled`, (!enabledProviders[provider]).toString());
  };

  const getConfiguredProvidersCount = () => {
    return Object.entries(apiKeys).filter(([provider, key]) => {
      const hasKey = key && key.length > 0;
      const hasModel = selectedModels[provider] && selectedModels[provider].length > 0;
      const isEnabled = enabledProviders[provider];
      return hasKey && hasModel && isEnabled;
    }).length;
  };

  const handleActivate = () => {
    if (isFusionMode) {
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
  const hasAnyKeys = Object.values(apiKeys).some(key => key && key.length > 0);

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
      
      {Object.entries({
        openai: { label: "OpenAI Configuration", bgColor: "bg-blue-500" },
        claude: { label: "Anthropic Claude Configuration", bgColor: "bg-purple-500" },
        google: { label: "Google PaLM Configuration", bgColor: "bg-green-500" },
        openrouter: { label: "OpenRouter Configuration", bgColor: "bg-orange-500" }
      }).map(([provider, config]) => (
        <div key={provider} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${provider}-toggle`} className="text-sm font-medium">
              Enable {config.label}
            </Label>
            <Switch
              id={`${provider}-toggle`}
              checked={enabledProviders[provider]}
              onCheckedChange={() => handleProviderToggle(provider)}
            />
          </div>
          {enabledProviders[provider] && (
            <ProviderConfig
              provider={provider as any}
              label={config.label}
              bgColor={config.bgColor}
              apiKey={apiKeys[provider]}
              onApiKeyChange={onApiKeyChange(provider)}
              selectedModel={selectedModels[provider]}
              onModelSelect={onModelSelect(provider)}
              statusQuery={providerQueries[provider]}
            />
          )}
        </div>
      ))}

      <div className="space-y-2">
        <Button 
          className={`w-full relative overflow-hidden group ${!isActivatable && !isFusionMode && !hasAnyKeys ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleActivate}
          disabled={!isActivatable && !isFusionMode && !hasAnyKeys}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isFusionMode ? 'Deactivate' : 'Activate'} Fusion Mode
            <Zap className="w-4 h-4" />
          </span>
        </Button>
        <p className="text-sm text-gray-500 text-center">
          {isFusionMode 
            ? "Multi-provider mode is active" 
            : `${configuredCount}/4 providers configured (${isActivatable ? 'Ready to activate' : hasAnyKeys ? `Need ${3 - configuredCount} more` : 'Enter API keys to begin'})`}
        </p>
      </div>
    </div>
  );
};

export default FusionModeSettings;