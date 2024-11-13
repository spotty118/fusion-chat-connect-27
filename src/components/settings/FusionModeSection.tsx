import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FusionModeSettings from './FusionModeSettings';

interface FusionModeSectionProps {
  fusionMode: boolean;
  onFusionModeChange: (checked: boolean) => void;
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  onApiKeyChange: (provider: string) => (value: string) => void;
  onModelSelect: (provider: string) => (model: string) => void;
  providerQueries: any;
  onActivate: () => void;
}

export const FusionModeSection = ({
  fusionMode,
  onFusionModeChange,
  apiKeys,
  selectedModels,
  onApiKeyChange,
  onModelSelect,
  providerQueries,
  onActivate
}: FusionModeSectionProps) => {
  return (
    <div className="space-y-4">
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
          onCheckedChange={onFusionModeChange}
        />
      </div>

      {fusionMode && (
        <FusionModeSettings
          apiKeys={apiKeys}
          selectedModels={selectedModels}
          onApiKeyChange={onApiKeyChange}
          onModelSelect={onModelSelect}
          providerQueries={providerQueries}
          onActivate={onActivate}
        />
      )}
    </div>
  );
};