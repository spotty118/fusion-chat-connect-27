import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Keyboard } from "lucide-react";
import { Card } from "@/components/ui/card";

export const KeyboardShortcutsSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Keyboard className="h-5 w-5" />
        <Label>Keyboard Shortcuts</Label>
      </div>
      <div className="grid gap-6">
        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-2 gap-4">
            <Label htmlFor="sendMessage">Send Message</Label>
            <Input 
              id="sendMessage" 
              value="⌘/Ctrl + Enter" 
              readOnly 
              className="bg-slate-50 dark:bg-slate-800/50"
            />
          </div>
        </Card>
        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-2 gap-4">
            <Label htmlFor="searchMessages">Search Messages</Label>
            <Input 
              id="searchMessages" 
              value="⌘/Ctrl + K" 
              readOnly 
              className="bg-slate-50 dark:bg-slate-800/50"
            />
          </div>
        </Card>
        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-2 gap-4">
            <Label htmlFor="exportChat">Export Chat</Label>
            <Input 
              id="exportChat" 
              value="⌘/Ctrl + E" 
              readOnly 
              className="bg-slate-50 dark:bg-slate-800/50"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};