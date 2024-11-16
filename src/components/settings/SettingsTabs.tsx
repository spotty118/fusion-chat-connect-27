import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FusionModeSettings from './FusionModeSettings';
import { LanguageSettings } from './LanguageSettings';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { ExportImportSettings } from './ExportImportSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { ManualApiSettings } from './ManualApiSettings';
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
      <div className="flex flex-col md:flex-row h-full gap-6">
        <div className="w-full md:w-48 shrink-0">
          <TabsList className="flex flex-row md:flex-col h-auto w-full space-y-0 space-x-2 md:space-x-0 md:space-y-2 bg-transparent p-2 sticky top-0">
            <TabsTrigger 
              value="providers" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              AI Providers
            </TabsTrigger>
            <TabsTrigger 
              value="manual-api" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              Manual API
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              Appearance
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="customization" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              Language
            </TabsTrigger>
            <TabsTrigger 
              value="shortcuts" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              Keyboard Shortcuts
            </TabsTrigger>
            <TabsTrigger 
              value="backup" 
              className="w-full justify-start data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
            >
              Backup & Restore
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 p-2">
          <TabsContent value="providers" className="mt-0 space-y-6">
            <FusionModeSettings
              apiKeys={apiKeys}
              selectedModels={selectedModels}
              onApiKeyChange={handleApiKeyChange}
              onModelSelect={handleModelSelect}
              providerQueries={providerQueries}
            />
          </TabsContent>
          
          <TabsContent value="manual-api" className="mt-0 space-y-6">
            <ManualApiSettings />
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-0 space-y-6">
            <AppearanceSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0 space-y-6">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="customization" className="mt-0 space-y-6">
            <LanguageSettings />
          </TabsContent>
          
          <TabsContent value="shortcuts" className="mt-0 space-y-6">
            <KeyboardShortcutsSettings />
          </TabsContent>
          
          <TabsContent value="backup" className="mt-0 space-y-6">
            <ExportImportSettings />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}