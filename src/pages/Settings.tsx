import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ModelSelector } from '@/components/ModelSelector';

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

  const handleFusionModeChange = (checked: boolean) => {
    const activeProviders = Object.entries(apiKeys).filter(([_, value]) => value.length > 0).length;
    
    if (checked && activeProviders < 3) {
      toast({
        title: "Insufficient Providers",
        description: "Please configure at least 3 provider API keys to enable Fusion Mode",
        variant: "destructive",
      });
      return;
    }
    
    setFusionMode(checked);
    if (!checked) {
      setSelectedModels({ openai: '', claude: '', google: '', openrouter: '' });
    }
    
    toast({
      title: checked ? "Fusion Mode Enabled" : "Fusion Mode Disabled",
      description: checked 
        ? "Please configure your API keys and select models for providers" 
        : "Using Window.AI provider",
    });
  };

  const handleApiKeyChange = (provider: keyof typeof apiKeys) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: e.target.value
    }));
  };

  const handleModelSelect = (provider: keyof typeof selectedModels) => (model: string) => {
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

  const renderProviderConfig = (
    provider: keyof typeof apiKeys,
    label: string,
    bgColor: string
  ) => (
    <div className="space-y-4" key={provider}>
      <Label htmlFor={`${provider}-key`} className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${bgColor}`} />
        <span>{label}</span>
      </Label>
      <Input
        id={`${provider}-key`}
        type="password"
        value={apiKeys[provider]}
        onChange={handleApiKeyChange(provider)}
        placeholder="Enter API key..."
        className="mb-2"
      />
      <ModelSelector
        provider={provider}
        apiKey={apiKeys[provider]}
        onModelSelect={handleModelSelect(provider)}
        selectedModel={selectedModels[provider]}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
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
            <div className="flex items-center justify-between space-x-2 relative overflow-hidden rounded-lg p-4 transition-all duration-300">
              <div className="space-y-0.5">
                <Label htmlFor="fusion-mode">Fusion Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Combine responses from multiple AI providers (requires at least 3 providers)
                </p>
              </div>
              {fusionMode && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-fusion-primary via-fusion-secondary to-fusion-primary opacity-10 animate-fusion-glow" />
                </div>
              )}
              <Switch
                id="fusion-mode"
                checked={fusionMode}
                onCheckedChange={handleFusionModeChange}
              />
            </div>

            {fusionMode && (
              <div className="space-y-6 animate-in fade-in-50">
                {renderProviderConfig('openai', 'OpenAI Configuration', 'bg-blue-500')}
                {renderProviderConfig('claude', 'Anthropic Claude Configuration', 'bg-purple-500')}
                {renderProviderConfig('google', 'Google PaLM Configuration', 'bg-green-500')}
                {renderProviderConfig('openrouter', 'OpenRouter Configuration', 'bg-orange-500')}

                <Button 
                  className="w-full"
                  onClick={handleActivate}
                >
                  Activate Fusion Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;