import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Plus, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PromptTemplateTools = () => {
  const { toast } = useToast();
  const [newTemplate, setNewTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');

  const saveTemplate = () => {
    if (!templateName || !newTemplate) {
      toast({
        title: "Error",
        description: "Please provide both a name and content for the template.",
        variant: "destructive",
      });
      return;
    }

    const templates = JSON.parse(localStorage.getItem('promptTemplates') || '{}');
    templates[templateName] = newTemplate;
    localStorage.setItem('promptTemplates', JSON.stringify(templates));
    
    setNewTemplate('');
    setTemplateName('');
    
    toast({
      title: "Template Saved",
      description: "Your prompt template has been saved successfully.",
    });
  };

  const viewTemplates = () => {
    const templates = JSON.parse(localStorage.getItem('promptTemplates') || '{}');
    const templatesList = Object.entries(templates)
      .map(([name, content]) => `${name}: ${content}`)
      .join('\n\n');
      
    toast({
      title: "Saved Templates",
      description: templatesList || "No templates found",
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Prompt Template Tools</h2>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="template">Template Content</Label>
          <Input
            id="template"
            value={newTemplate}
            onChange={(e) => setNewTemplate(e.target.value)}
            placeholder="Enter template content..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={saveTemplate}
        >
          <Plus className="h-4 w-4" />
          Save Template
        </Button>
        
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={viewTemplates}
        >
          <FileText className="h-4 w-4" />
          View Templates
        </Button>
      </div>
    </Card>
  );
};