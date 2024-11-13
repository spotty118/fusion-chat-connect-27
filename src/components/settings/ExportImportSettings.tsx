import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload } from "lucide-react";

export const ExportImportSettings = () => {
  const { toast } = useToast();

  const handleExport = () => {
    const settings = {
      apiKeys: localStorage.getItem('apiKeys'),
      selectedModels: localStorage.getItem('selectedModels'),
      fusionMode: localStorage.getItem('fusionMode'),
    };

    const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Your settings have been exported successfully",
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const settings = JSON.parse(text);
          
          Object.entries(settings).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value as string);
          });

          toast({
            title: "Settings Imported",
            description: "Your settings have been imported successfully",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Failed to import settings. Please check the file format.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <Label>Backup & Restore</Label>
      <div className="flex space-x-4">
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Settings
        </Button>
        <Button onClick={handleImport} variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Settings
        </Button>
      </div>
    </div>
  );
};