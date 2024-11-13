import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsSection } from '@/components/settings/SettingsSection';
import { FusionModeSection } from '@/components/settings/FusionModeSection';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { ExportImportSettings } from '@/components/settings/ExportImportSettings';
import { KeyboardShortcutsSettings } from '@/components/settings/KeyboardShortcutsSettings';
import { useProviderStatus } from '@/hooks/useProviderStatus';
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      <div className="flex">
        {/* Left sidebar with tabs */}
        <div className="w-64 min-h-screen border-r bg-white p-4">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6 w-full justify-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Tabs defaultValue="fusion" orientation="vertical" className="w-full">
            <TabsList className="flex flex-col h-full space-y-2">
              <TabsTrigger value="fusion" className="w-full justify-start">
                AI Providers
              </TabsTrigger>
              <TabsTrigger value="customization" className="w-full justify-start">
                Customization
              </TabsTrigger>
              <TabsTrigger value="keyboard" className="w-full justify-start">
                Keyboard Shortcuts
              </TabsTrigger>
              <TabsTrigger value="backup" className="w-full justify-start">
                Backup & Restore
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main content area */}
        <div className="flex-1 p-8">
          <Tabs defaultValue="fusion" orientation="vertical">
            <TabsContent value="fusion" className="mt-0">
              <SettingsSection title="AI Providers">
                <FusionModeSection
                  fusionMode={fusionMode}
                  onFusionModeChange={handleFusionModeChange}
                  apiKeys={apiKeys}
                  selectedModels={selectedModels}
                  onApiKeyChange={handleApiKeyChange}
                  onModelSelect={handleModelSelect}
                  providerQueries={providerQueries}
                  onActivate={() => navigate('/')}
                />
              </SettingsSection>
            </TabsContent>

            <TabsContent value="customization" className="mt-0">
              <SettingsSection title="Customization">
                <LanguageSettings />
              </SettingsSection>
            </TabsContent>

            <TabsContent value="keyboard" className="mt-0">
              <SettingsSection title="Keyboard Shortcuts">
                <KeyboardShortcutsSettings />
              </SettingsSection>
            </TabsContent>

            <TabsContent value="backup" className="mt-0">
              <SettingsSection title="Backup & Restore">
                <ExportImportSettings />
              </SettingsSection>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;