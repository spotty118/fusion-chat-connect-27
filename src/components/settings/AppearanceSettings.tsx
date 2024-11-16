import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const AppearanceSettings = () => {
  const { toast } = useToast();
  const [isCompactMode, setIsCompactMode] = useState(() => 
    document.documentElement.classList.contains('compact')
  );

  useEffect(() => {
    document.documentElement.classList.toggle('compact', isCompactMode);
    localStorage.setItem('compactMode', String(isCompactMode));
  }, [isCompactMode]);

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