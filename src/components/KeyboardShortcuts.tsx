import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

export const KeyboardShortcuts = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Send Message</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">⌘/Ctrl + Enter</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Search Messages</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">⌘/Ctrl + K</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Export Chat</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">⌘/Ctrl + E</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Settings</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">⌘/Ctrl + ,</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};