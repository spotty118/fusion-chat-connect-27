import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';
import FusionModeSettings from '@/components/settings/FusionModeSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { ExportImportSettings } from '@/components/settings/ExportImportSettings';
import { KeyboardShortcutsSettings } from '@/components/settings/KeyboardShortcutsSettings';
import { useProviderStatus } from '@/hooks/useProviderStatus';
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [fusionMode, setFusionMode] = React.useState(() => {
    return localStorage.getItem('fusionMode') === 'true';
  });
  
  const [apiKeys, setApiKeys] = React.useState<Record<string, string>>({
    openai: '',
    claude: '',
    google: '',
    openrouter: '',
  });

  const [selectedModels, setSelectedModels] = React.useState(() => ({
    openai: localStorage.getItem('openai_model') || '',
    claude: localStorage.getItem('claude_model') || '',
    google: localStorage.getItem('google_model') || '',
    openrouter: localStorage.getItem('openrouter_model') || '',
  }));

  // Fetch existing API keys on component mount
  React.useEffect(() => {
    const fetchApiKeys = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, api_key')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching API keys:', error);
        return;
      }

      if (data) {
        const keys = {
          openai: '',
          claude: '',
          google: '',
          openrouter: '',
        };
        
        data.forEach(({ provider, api_key }) => {
          keys[provider as keyof typeof keys] = api_key;
        });
        
        setApiKeys(keys);
        
        // Also set in localStorage for compatibility
        Object.entries(keys).forEach(([provider, key]) => {
          if (key) localStorage.setItem(`${provider}_key`, key);
        });
      }
    };

    fetchApiKeys();
  }, []);

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
  };

  const handleApiKeyChange = (provider: string) => async (value: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save API keys.",
          variant: "destructive",
        });
        return;
      }

      // Update state and localStorage
      setApiKeys(prev => ({
        ...prev,
        [provider]: value
      }));
      localStorage.setItem(`${provider}_key`, value);

      // Save to Supabase
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: session.user.id,
          provider,
          api_key: value
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) {
        console.error('Error saving API key:', error);
        toast({
          title: "Error Saving API Key",
          description: `Failed to save ${provider} API key: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "API Key Saved",
          description: `${provider} API key has been saved successfully.`,
        });
      }
    } catch (error) {
      console.error('Error in handleApiKeyChange:', error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleModelSelect = (provider: string) => (model: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [provider]: model
    }));
    localStorage.setItem(`${provider}_model`, model);
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
                  Combine responses from multiple AI providers
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
                onActivate={() => navigate('/')}
              />
            )}

            <div className="border-t pt-6">
              <LanguageSettings />
            </div>

            <div className="border-t pt-6">
              <KeyboardShortcutsSettings />
            </div>

            <div className="border-t pt-6">
              <ExportImportSettings />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
