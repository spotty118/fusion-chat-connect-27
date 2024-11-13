import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Keyboard } from "lucide-react";

export const KeyboardShortcutsSettings = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Keyboard className="h-5 w-5" />
        <Label>Keyboard Shortcuts</Label>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Label htmlFor="sendMessage">Send Message</Label>
          <Input id="sendMessage" value="⌘/Ctrl + Enter" readOnly />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label htmlFor="searchMessages">Search Messages</Label>
          <Input id="searchMessages" value="⌘/Ctrl + K" readOnly />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label htmlFor="exportChat">Export Chat</Label>
          <Input id="exportChat" value="⌘/Ctrl + E" readOnly />
        </div>
      </div>
    </div>
  );
};