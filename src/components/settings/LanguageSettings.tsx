import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" }
];

export const LanguageSettings = () => {
  return (
    <Card className="p-6 space-y-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex items-center space-x-2">
        <Globe2 className="h-5 w-5" />
        <Label>Language</Label>
      </div>
      <Select defaultValue="en">
        <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
};