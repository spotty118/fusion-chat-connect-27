import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Moon } from "lucide-react";
import { useState } from "react";

export const AppearanceSettings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);

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
            onCheckedChange={setIsDarkMode}
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
            onCheckedChange={setIsCompactMode}
          />
        </div>
      </div>
    </div>
  );
};