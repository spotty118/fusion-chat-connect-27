import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';

interface SettingsSidebarProps {
  onBack: () => void;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const SettingsSidebar = ({ onBack, activeTab, onTabChange }: SettingsSidebarProps) => {
  return (
    <div className="w-64 min-h-screen border-r bg-white">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="w-full justify-start mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <TabsList className="flex flex-col w-full space-y-2">
            <TabsTrigger 
              value="fusion" 
              className="w-full justify-start"
              onClick={() => onTabChange('fusion')}
              data-state={activeTab === 'fusion' ? 'active' : ''}
            >
              AI Providers
            </TabsTrigger>
            <TabsTrigger 
              value="customization" 
              className="w-full justify-start"
              onClick={() => onTabChange('customization')}
              data-state={activeTab === 'customization' ? 'active' : ''}
            >
              Customization
            </TabsTrigger>
            <TabsTrigger 
              value="keyboard" 
              className="w-full justify-start"
              onClick={() => onTabChange('keyboard')}
              data-state={activeTab === 'keyboard' ? 'active' : ''}
            >
              Keyboard Shortcuts
            </TabsTrigger>
            <TabsTrigger 
              value="backup" 
              className="w-full justify-start"
              onClick={() => onTabChange('backup')}
              data-state={activeTab === 'backup' ? 'active' : ''}
            >
              Backup & Restore
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </div>
  );
};