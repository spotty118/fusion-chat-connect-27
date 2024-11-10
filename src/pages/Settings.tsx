import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ModelSelector } from '@/components/ModelSelector';
import { useQuery } from '@tanstack/react-query';

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fusionMode, setFusionMode] = React.useState(false);
  const [apiKeys, setApiKeys] = React.useState({
    openai: '',
    claude: '',
    google: '',
    openrouter: '',
  });
  const [selectedModels, setSelectedModels] = React.useState({
    openai: '',
    claude: '',
    google: '',
    openrouter: '',
  });

  // Add status checks for each provider
  const checkProviderStatus = async (provider: string, apiKey: string) => {
    if (!apiKey) return false;
    try {
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

      const response = await fetch(endpoints[provider as keyof typeof endpoints], {
        headers
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Status queries for each provider
  const providerQueries = {
    openai: useQuery({
      queryKey: ['provider-status', 'openai', apiKeys.openai],
      queryFn: () => checkProviderStatus('openai', apiKeys.openai),
      enabled: !!apiKeys.openai,
    }),
    claude: useQuery({
      queryKey: ['provider-status', 'claude', apiKeys.claude],
      queryFn: () => checkProviderStatus('claude', apiKeys.claude),
      enabled: !!apiKeys.claude,
    }),
    google: useQuery({
      queryKey: ['provider-status', 'google', apiKeys.google],
      queryFn: () => checkProviderStatus('google', apiKeys.google),
      enabled: !!apiKeys.google,
    }),
    openrouter: useQuery({
      queryKey: ['provider-status', 'openrouter', apiKeys.openrouter],
      queryFn: () => checkProviderStatus('openrouter', apiKeys.openrouter),
      enabled: !!apiKeys.openrouter,
    }),
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleFusionModeChange = (checked: boolean) => {
    setFusionMode(checked);
    
    if (checked) {
      toast({
        title: "Fusion Mode Enabled",
        description: "Please configure your API keys and select models for providers",
      });
    } else {
      setSelectedModels({ openai: '', claude: '', google: '', openrouter: '' });
      toast({
        title: "Fusion Mode Disabled",
        description: "Using Window.AI provider",
      });
    }
  };

  const handleApiKeyChange = (provider: keyof typeof apiKeys) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: e.target.value
    }));
  };

  const handleModelSelect = (provider: keyof typeof selectedModels) => (model: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [provider]: model
    }));
  };

  const handleActivate = () => {
    const activeProviders = Object.entries(apiKeys).filter(([_, value]) => value.length > 0);
    const activeModels = Object.entries(selectedModels).filter(([provider, model]) => 
      apiKeys[provider as keyof typeof apiKeys] && model
    );

    if (activeProviders.length < 3) {
      toast({
        title: "Insufficient Providers",
        description: "Please configure at least 3 provider API keys",
        variant: "destructive",
      });
      return;
    }

    if (activeModels.length < activeProviders.length) {
      toast({
        title: "Missing Models",
        description: "Please select models for all configured providers",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Fusion Mode Activated",
      description: "All providers configured successfully",
    });
  };

  const renderProviderConfig = (
    provider: keyof typeof apiKeys,
    label: string,
    bgColor: string
  ) => {
    const status = providerQueries[provider].data;
    const isLoading = providerQueries[provider].isLoading;

    return (
      <div className="space-y-4" key={provider}>
        <div className="flex items-center justify-between">
          <Label htmlFor={`${provider}-key`} className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${bgColor}`} />
            <span>{label}</span>
          </Label>
          {apiKeys[provider] && !isLoading && (
            status ? 
              <CheckCircle2 className="h-5 w-5 text-green-500" /> :
              <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <Input
          id={`${provider}-key`}
          type="password"
          value={apiKeys[provider]}
          onChange={handleApiKeyChange(provider)}
          placeholder="Enter API key..."
          className="mb-2"
        />
        <ModelSelector
          provider={provider}
          apiKey={apiKeys[provider]}
          onModelSelect={handleModelSelect(provider)}
          selectedModel={selectedModels[provider]}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure your AI chat experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="fusion-mode">Fusion Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Combine responses from multiple AI providers (requires at least 3 providers)
                </p>
              </div>
              <Switch
                id="fusion-mode"
                checked={fusionMode}
                onCheckedChange={handleFusionModeChange}
              />
            </div>

            {fusionMode && (
              <div className="space-y-6 animate-in fade-in-50">
                {renderProviderConfig('openai', 'OpenAI Configuration', 'bg-blue-500')}
                {renderProviderConfig('claude', 'Anthropic Claude Configuration', 'bg-purple-500')}
                {renderProviderConfig('google', 'Google PaLM Configuration', 'bg-green-500')}
                {renderProviderConfig('openrouter', 'OpenRouter Configuration', 'bg-orange-500')}

                <Button 
                  className="w-full"
                  onClick={handleActivate}
                >
                  Activate Fusion Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;