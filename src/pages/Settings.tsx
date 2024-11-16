import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-xl p-6">
          <SettingsTabs />
        </Card>
      </div>
    </div>
  );
};

export default Settings;