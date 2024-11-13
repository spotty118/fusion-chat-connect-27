import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FusionModeSettings from './FusionModeSettings';
import { LanguageSettings } from './LanguageSettings';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { ExportImportSettings } from './ExportImportSettings';
import { useState } from 'react';
import { useProviderStatus } from '@/hooks/useProviderStatus';

export function SettingsTabs() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    claude: '',
    google: '',
    openrouter: '',
  });

  const [selectedModels, setSelectedModels] = useState(() => ({
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

  const handleApiKeyChange = (provider: string) => async (value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    localStorage.setItem(`${provider}_key`, value);
  };

  const handleModelSelect = (provider: string) => (model: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [provider]: model
    }));
    localStorage.setItem(`${provider}_model`, model);
  };

  return (
    <div className="flex h-full">
      <TabsList className="flex-col h-auto space-y-2 bg-muted p-2">
        <TabsTrigger value="providers" className="justify-start">
          AI Providers
        </TabsTrigger>
        <TabsTrigger value="customization" className="justify-start">
          Customization
        </TabsTrigger>
        <TabsTrigger value="shortcuts" className="justify-start">
          Keyboard Shortcuts
        </TabsTrigger>
        <TabsTrigger value="backup" className="justify-start">
          Backup & Restore
        </TabsTrigger>
      </TabsList>
      
      <div className="flex-1 pl-6">
        <Tabs defaultValue="providers">
          <TabsContent value="providers" className="mt-0">
            <FusionModeSettings
              apiKeys={apiKeys}
              selectedModels={selectedModels}
              onApiKeyChange={handleApiKeyChange}
              onModelSelect={handleModelSelect}
              providerQueries={providerQueries}
              onActivate={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="customization" className="mt-0">
            <LanguageSettings />
          </TabsContent>
          
          <TabsContent value="shortcuts" className="mt-0">
            <KeyboardShortcutsSettings />
          </TabsContent>
          
          <TabsContent value="backup" className="mt-0">
            <ExportImportSettings />
          </TabsContent>
        </div>
      </div>
    </div>
  );
}