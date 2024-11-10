import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fusionMode, setFusionMode] = React.useState(false);
  const [apiKeys, setApiKeys] = React.useState({
    openai: '',
    claude: '',
    google: '',
  });

  const handleFusionModeChange = (checked: boolean) => {
    setFusionMode(checked);
    toast({
      title: checked ? "Fusion Mode Enabled" : "Fusion Mode Disabled",
      description: checked 
        ? "Please configure your API keys for all providers" 
        : "Using Window.AI provider",
    });
  };

  const handleApiKeyChange = (provider: keyof typeof apiKeys) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: e.target.value
    }));
  };

  const handleActivate = () => {
    if (Object.values(apiKeys).some(key => !key)) {
      toast({
        title: "Missing API Keys",
        description: "Please enter all API keys before activating",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Fusion Mode Activated",
      description: "All providers configured successfully",
    });
  };

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
                  Combine responses from multiple AI providers
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
              <div className="space-y-4 animate-message-in">
                <div className="space-y-2">
                  <Label htmlFor="openai-key" className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-fusion-openai" />
                    <span>OpenAI API Key</span>
                  </Label>
                  <Input
                    id="openai-key"
                    type="password"
                    value={apiKeys.openai}
                    onChange={handleApiKeyChange('openai')}
                    placeholder="sk-..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claude-key" className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-fusion-claude" />
                    <span>Anthropic Claude API Key</span>
                  </Label>
                  <Input
                    id="claude-key"
                    type="password"
                    value={apiKeys.claude}
                    onChange={handleApiKeyChange('claude')}
                    placeholder="sk-ant-..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-key" className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-fusion-google" />
                    <span>Google PaLM API Key</span>
                  </Label>
                  <Input
                    id="google-key"
                    type="password"
                    value={apiKeys.google}
                    onChange={handleApiKeyChange('google')}
                    placeholder="AIza..."
                  />
                </div>

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