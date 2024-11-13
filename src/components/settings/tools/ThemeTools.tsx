import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paintbrush } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const THEMES = {
  default: {
    primary: "222.2 47.4% 11.2%",
    background: "0 0% 100%",
  },
  dark: {
    primary: "210 40% 98%",
    background: "222.2 84% 4.9%",
  },
  forest: {
    primary: "142 76% 36%",
    background: "120 16% 93%",
  },
  ocean: {
    primary: "217 91% 60%",
    background: "190 20% 95%",
  },
};

export const ThemeTools = () => {
  const { toast } = useToast();
  const [currentTheme, setCurrentTheme] = useState(() => 
    localStorage.getItem('theme') || 'default'
  );

  const applyTheme = (themeName: keyof typeof THEMES) => {
    const theme = THEMES[themeName];
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    localStorage.setItem('theme', themeName);
    setCurrentTheme(themeName);

    toast({
      title: "Theme Updated",
      description: `Theme has been changed to ${themeName}.`,
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Paintbrush className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Theme Customization</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((theme) => (
          <Button
            key={theme}
            variant={currentTheme === theme ? "default" : "outline"}
            className="w-full capitalize"
            onClick={() => applyTheme(theme)}
          >
            {theme}
          </Button>
        ))}
      </div>
    </Card>
  );
};