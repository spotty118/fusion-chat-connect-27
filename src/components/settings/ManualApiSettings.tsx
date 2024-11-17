import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Key } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ManualApiSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState(() => localStorage.getItem('manualProvider') || 'openai');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(`${selectedProvider}_key`) || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(`${selectedProvider}_model`) || '');

  // Fetch existing API keys from Supabase on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: apiKeys, error } = await supabase
          .from('api_keys')
          .select('provider, api_key')
          .eq('user_id', session.user.id);

        if (error) throw error;

        // Update localStorage with fetched keys
        apiKeys?.forEach(({ provider, api_key }) => {
          localStorage.setItem(`${provider}_key`, api_key);
        });

        // Update current API key if one exists for selected provider
        const currentProviderKey = apiKeys?.find(k => k.provider === selectedProvider)?.api_key;
        if (currentProviderKey) {
          setApiKey(currentProviderKey);
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
      }
    };

    fetchApiKeys();
  }, []);

  // Update API key in localStorage and Supabase when it changes
  const handleApiKeyChange = async (value: string) => {
    console.log('Saving API key for provider:', selectedProvider);
    setApiKey(value);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        return;
      }

      if (value) {
        localStorage.setItem(`${selectedProvider}_key`, value);
        
        // Upsert the API key in Supabase
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            user_id: session.user.id,
            provider: selectedProvider,
            api_key: value
          }, {
            onConflict: 'user_id,provider'
          });

        if (error) throw error;

        toast({
          title: "API Key Saved",
          description: `Your ${selectedProvider} API key has been saved`,
        });
      } else {
        // Remove API key if value is empty
        localStorage.removeItem(`${selectedProvider}_key`);
        
        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', session.user.id)
          .eq('provider', selectedProvider);

        if (error) throw error;

        toast({
          title: "API Key Removed",
          description: `Your ${selectedProvider} API key has been removed`,
        });
      }

      // Reset selected model when API key changes
      setSelectedModel('');
      // Invalidate the models query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['models', selectedProvider] });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle provider change
  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem('manualProvider', selectedProvider);
      // Load the stored API key for the selected provider
      const storedKey = localStorage.getItem(`${selectedProvider}_key`) || '';
      setApiKey(storedKey);
      // Load the stored model for the selected provider
      const storedModel = localStorage.getItem(`${selectedProvider}_model`) || '';
      setSelectedModel(storedModel);
    } else {
      localStorage.removeItem('manualProvider');
    }
  }, [selectedProvider]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Key className="h-5 w-5" />
        <Label>Manual API Configuration</Label>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="google">Google PaLM</SelectItem>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">{selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder={`Enter your ${selectedProvider} API key...`}
          />
          <p className="text-sm text-muted-foreground">
            Used as fallback when Window AI extension is not available
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <ModelSelector
            provider={selectedProvider as 'openai' | 'claude' | 'google' | 'openrouter'}
            apiKey={apiKey}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
};