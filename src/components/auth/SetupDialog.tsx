import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabaseUrl: string;
  supabaseKey: string;
  onUrlChange: (url: string) => void;
  onKeyChange: (key: string) => void;
  onInitialize: () => void;
  onSkipSetup: () => void;
}

export const SetupDialog = ({
  open,
  onOpenChange,
  supabaseUrl,
  supabaseKey,
  onUrlChange,
  onKeyChange,
  onInitialize,
  onSkipSetup,
}: SetupDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Supabase Project</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p>To use this application, you'll need to connect it to your own Supabase project. Follow these steps:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Create a new project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">supabase.com</a></li>
              <li>Go to your project settings</li>
              <li>Copy your project URL and anon key</li>
              <li>Paste them below</li>
            </ol>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Project URL</Label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => onUrlChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabaseKey">Anon Key</Label>
                <Input
                  id="supabaseKey"
                  type="password"
                  placeholder="your-anon-key"
                  value={supabaseKey}
                  onChange={(e) => onKeyChange(e.target.value)}
                />
              </div>
              <Button onClick={onInitialize} className="w-full">
                Connect to Supabase
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onSkipSetup}
              >
                Skip Database Setup
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};