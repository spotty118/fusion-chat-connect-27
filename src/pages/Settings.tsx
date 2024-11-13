import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Tabs } from "@/components/ui/tabs";
import { useProviderStatus } from '@/hooks/useProviderStatus';
import { supabase } from "@/integrations/supabase/client";
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { SettingsContent } from '@/components/settings/SettingsContent';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('fusion');
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

      setApiKeys(prev => ({
        ...prev,
        [provider]: value
      }));
      localStorage.setItem(`${provider}_key`, value);

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1">
          <SettingsSidebar
            onBack={handleBack}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <SettingsContent
            activeTab={activeTab}
            fusionMode={fusionMode}
            onFusionModeChange={handleFusionModeChange}
            apiKeys={apiKeys}
            selectedModels={selectedModels}
            onApiKeyChange={handleApiKeyChange}
            onModelSelect={handleModelSelect}
            providerQueries={providerQueries}
            onActivate={() => navigate('/')}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
