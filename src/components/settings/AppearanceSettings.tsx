import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export const AppearanceSettings = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(() => 
    localStorage.getItem('darkMode') === 'true'
  );
  const [isCompactMode, setIsCompactMode] = useState(() => 
    localStorage.getItem('compactMode') === 'true'
  );

  useEffect(() => {
    // Apply dark mode
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', String(isDarkMode));
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Apply compact mode
    document.documentElement.classList.toggle('compact', isCompactMode);
    localStorage.setItem('compactMode', String(isCompactMode));
  }, [isCompactMode]);

  const handleDarkModeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    toast({
      title: checked ? "Dark Mode Enabled" : "Dark Mode Disabled",
      description: checked ? "The dark theme has been activated" : "The light theme has been activated",
    });
  };

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