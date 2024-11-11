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
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fusionMode, setFusionMode] = React.useState(() => {
    return localStorage.getItem('fusionMode') === 'true';
  });
  
  const [apiKeys, setApiKeys] = React.useState(() => ({
    openai: localStorage.getItem('openai_key') || '',
    claude: localStorage.getItem('claude_key') || '',
    google: localStorage.getItem('google_key') || '',
    openrouter: localStorage.getItem('openrouter_key') || '',
  }));
  
  const [selectedModels, setSelectedModels] = React.useState(() => ({
    openai: localStorage.getItem('openai_model') || '',
    claude: localStorage.getItem('claude_model') || '',
    google: localStorage.getItem('google_model') || '',
    openrouter: localStorage.getItem('openrouter_model') || '',
  }));

  const providerQueries = {
    openai: useProviderStatus('openai', apiKeys.openai),
    claude: useProviderStatus('claude', apiKeys.claude),
    google: useProviderStatus('google', apiKeys.google),
    openrouter: useProviderStatus('openrouter', apiKeys.openrouter),
  };

  const handleBack = () => navigate('/');

  const handleFusionModeChange = (checked: boolean) => {
    setFusionMode(checked);
    localStorage.setItem('fusionMode', checked.toString());
    if (checked) {
      toast({
        title: "Fusion Mode Enabled",
        description: "Please configure your API keys and select models for providers",
      });
    } else {
      setSelectedModels({ openai: '', claude: '', google: '', openrouter: '' });
      Object.keys(selectedModels).forEach(provider => {
        localStorage.removeItem(`${provider}_model`);
      });
      toast({
        title: "Fusion Mode Disabled",
        description: "Using Window.AI provider",
      });
    }
  };

  const handleApiKeyChange = (provider: string) => async (value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    localStorage.setItem(`${provider}_key`, value);

    // Save API key to Supabase
    if (value) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save API keys.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .upsert({
          provider,
          api_key: value,
          user_id: user.id
        }, {
          onConflict: 'provider,user_id'
        });

      if (error) {
        console.error('Error saving API key:', error);
        toast({
          title: "Error Saving API Key",
          description: `Failed to save ${provider} API key. Please try again.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "API Key Saved",
          description: `${provider} API key has been saved successfully.`,
        });
      }
    }
  };

  const handleModelSelect = (provider: string) => (model: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [provider]: model
    }));
    localStorage.setItem(`${provider}_model`, model);
  };

  const handleActivate = () => {
    const activeProviders = Object.entries(apiKeys).filter(([provider, value]) => 
      value.length > 0 && selectedModels[provider as keyof typeof selectedModels]
    );

    if (activeProviders.length < 3) {
      toast({
        title: "Insufficient Providers",
        description: "Please configure at least 3 provider API keys and select their models",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Fusion Mode Activated",
      description: "All providers configured successfully",
    });
    navigate('/');
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
              Configure your AI chat experience. Make sure to save your API keys to use the providers.
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