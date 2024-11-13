import { TabsContent } from "@/components/ui/tabs";
import { SettingsSection } from './SettingsSection';
import { FusionModeSection } from './FusionModeSection';
import { LanguageSettings } from './LanguageSettings';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { ExportImportSettings } from './ExportImportSettings';

interface SettingsContentProps {
  activeTab: string;
  fusionMode: boolean;
  onFusionModeChange: (checked: boolean) => void;
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  onApiKeyChange: (provider: string) => (value: string) => void;
  onModelSelect: (provider: string) => (model: string) => void;
  providerQueries: any;
  onActivate: () => void;
}

export const SettingsContent = ({
  activeTab,
  fusionMode,
  onFusionModeChange,
  apiKeys,
  selectedModels,
  onApiKeyChange,
  onModelSelect,
  providerQueries,
  onActivate
}: SettingsContentProps) => {
  return (
    <div className="flex-1 p-8">
      <TabsContent value="fusion" className="mt-0" forceMount hidden={activeTab !== 'fusion'}>
        <SettingsSection title="AI Providers">
          <FusionModeSection
            fusionMode={fusionMode}
            onFusionModeChange={onFusionModeChange}
            apiKeys={apiKeys}
            selectedModels={selectedModels}
            onApiKeyChange={onApiKeyChange}
            onModelSelect={onModelSelect}
            providerQueries={providerQueries}
            onActivate={onActivate}
          />
        </SettingsSection>
      </TabsContent>

      <TabsContent value="customization" className="mt-0" forceMount hidden={activeTab !== 'customization'}>
        <SettingsSection title="Customization">
          <LanguageSettings />
        </SettingsSection>
      </TabsContent>

      <TabsContent value="keyboard" className="mt-0" forceMount hidden={activeTab !== 'keyboard'}>
        <SettingsSection title="Keyboard Shortcuts">
          <KeyboardShortcutsSettings />
        </SettingsSection>
      </TabsContent>

      <TabsContent value="backup" className="mt-0" forceMount hidden={activeTab !== 'backup'}>
        <SettingsSection title="Backup & Restore">
          <ExportImportSettings />
        </SettingsSection>
      </TabsContent>
    </div>
  );
};