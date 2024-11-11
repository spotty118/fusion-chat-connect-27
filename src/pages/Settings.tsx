import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import FusionModeSettings from '@/components/settings/FusionModeSettings';

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

  const checkProviderStatus = async (provider: string, apiKey: string) => {
    if (!apiKey) return false;
    
    // For Claude, we'll use the messages endpoint directly with the correct header
    if (provider === 'claude') {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    }

    // For other providers
    try {
      const endpoints = {
        openai: 'https://api.openai.com/v1/models',
        google: 'https://generativelanguage.googleapis.com/v1beta/models',
        openrouter: 'https://openrouter.ai/api/v1/models',
      };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      const response = await fetch(endpoints[provider as keyof typeof endpoints], { headers });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

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

  const handleFusionModeChange = (checked) => {
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

  const handleApiKeyChange = (provider) => (value) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleModelSelect = (provider) => (model) => {
    setSelectedModels(prev => ({
      ...prev,
      [provider]: model
    }));
  };

  const handleActivate = () => {
    const activeProviders = Object.entries(apiKeys).filter(([_, value]) => value.length > 0);
    const activeModels = Object.entries(selectedModels).filter(([provider, model]) => 
      apiKeys[provider] && model
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
              <FusionModeSettings
                apiKeys={apiKeys}
                selectedModels={selectedModels}
                onApiKeyChange={handleApiKeyChange}
                onModelSelect={handleModelSelect}
                providerQueries={providerQueries}
                onActivate={handleActivate}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;