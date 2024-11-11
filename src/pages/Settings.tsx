import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import FusionModeSettings from '@/components/settings/FusionModeSettings';
import { useProviderStatus } from '@/hooks/useProviderStatus';

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

  const providerQueries = {
    openai: useProviderStatus('openai', apiKeys.openai),
    claude: useProviderStatus('claude', apiKeys.claude),
    google: useProviderStatus('google', apiKeys.google),
    openrouter: useProviderStatus('openrouter', apiKeys.openrouter),
  };

  const handleBack = () => navigate('/');

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

  const handleApiKeyChange = (provider: string) => (value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleModelSelect = (provider: string) => (model: string) => {
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