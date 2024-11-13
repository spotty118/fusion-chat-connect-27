import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, LogOut, SplitSquareHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CurrentModel } from '@/components/CurrentModel';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { supabase } from "@/integrations/supabase/client";

interface ChatHeaderProps {
  isFusionMode: boolean;
  sidePanelOpen: boolean;
  onToggleSidePanel: () => void;
}

export const ChatHeader = ({ isFusionMode, sidePanelOpen, onToggleSidePanel }: ChatHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-br from-fusion-primary to-fusion-secondary p-6 text-white shadow-2xl sticky top-0 z-10 backdrop-blur-lg bg-opacity-95">
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">ThinkLink</h1>
          <CurrentModel />
        </div>
        <div className="flex items-center gap-3">
          {isFusionMode && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-all duration-300 rounded-2xl w-12 h-12 hover:scale-105"
              onClick={onToggleSidePanel}
            >
              <SplitSquareHorizontal className="h-5 w-5" />
            </Button>
          )}
          <KeyboardShortcuts />
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 transition-all duration-300 rounded-2xl w-12 h-12 hover:scale-105"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 transition-all duration-300 rounded-2xl w-12 h-12 hover:scale-105"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};