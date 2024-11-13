import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FusionModeSettings from './FusionModeSettings';
import { LanguageSettings } from './LanguageSettings';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { ExportImportSettings } from './ExportImportSettings';
import { ChatHistoryTools } from './tools/ChatHistoryTools';
import { ModelConfigTools } from './tools/ModelConfigTools';
import { PromptTemplateTools } from './tools/PromptTemplateTools';
import { ApiKeyTools } from './tools/ApiKeyTools';
import { ThemeTools } from './tools/ThemeTools';
import { AnalyticsTools } from './tools/AnalyticsTools';
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
    <Tabs defaultValue="providers" className="w-full h-[calc(100vh-8rem)]">
      <div className="flex h-full gap-6">
        <div className="w-48 shrink-0">
          <TabsList className="flex-col h-auto w-full space-y-2 bg-muted p-2 sticky top-0">
            <TabsTrigger value="providers" className="justify-start w-full">
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="tools" className="justify-start w-full">
              Tools
            </TabsTrigger>
            <TabsTrigger value="analytics" className="justify-start w-full">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="customization" className="justify-start w-full">
              Language
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="justify-start w-full">
              Keyboard Shortcuts
            </TabsTrigger>
            <TabsTrigger value="backup" className="justify-start w-full">
              Backup & Restore
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TabsContent value="providers" className="mt-0">
            <FusionModeSettings
              apiKeys={apiKeys}
              selectedModels={selectedModels}
              onApiKeyChange={handleApiKeyChange}
              onModelSelect={handleModelSelect}
              providerQueries={providerQueries}
            />
          </TabsContent>
          
          <TabsContent value="tools" className="mt-0 space-y-6">
            <ChatHistoryTools />
            <ModelConfigTools />
            <PromptTemplateTools />
            <ApiKeyTools />
            <ThemeTools />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsTools />
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
    </Tabs>
  );
}