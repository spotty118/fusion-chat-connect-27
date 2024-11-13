import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const AppearanceSettings = () => {
  const { toast } = useToast();
  
  // Initialize state from localStorage or default values
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? savedMode === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const savedMode = localStorage.getItem('compactMode');
    return savedMode ? savedMode === 'true' : false;
  });

  // Apply dark mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Apply compact mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('compact', isCompactMode);
    localStorage.setItem('compactMode', String(isCompactMode));
  }, [isCompactMode]);

  // Handle dark mode toggle
  const handleDarkModeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    toast({
      title: checked ? "Dark Mode Enabled" : "Dark Mode Disabled",
      description: checked ? "The dark theme has been activated" : "The light theme has been activated",
    });
  };

  // Handle compact mode toggle
  const handleCompactModeChange = (checked: boolean) => {
    setIsCompactMode(checked);
    toast({
      title: checked ? "Compact Mode Enabled" : "Compact Mode Disabled",
      description: checked ? "Interface spacing has been reduced" : "Interface spacing has been restored",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Moon className="h-5 w-5" />
        <Label>Appearance</Label>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark themes
            </p>
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={handleDarkModeChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Compact Mode</Label>
            <p className="text-sm text-muted-foreground">
              Reduce spacing in the interface
            </p>
          </div>
          <Switch
            checked={isCompactMode}
            onCheckedChange={handleCompactModeChange}
          />
        </div>
      </div>
    </div>
  );
};