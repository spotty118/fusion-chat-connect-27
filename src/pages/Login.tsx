import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
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

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSetupDialog, setShowSetupDialog] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseClient, setSupabaseClient] = useState(null);

  const initializeSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Error",
        description: "Please enter both Supabase URL and anon key",
        variant: "destructive"
      });
      return;
    }

    try {
      const client = createClient(supabaseUrl, supabaseKey);
      
      // Test the connection
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      // Store credentials in localStorage
      localStorage.setItem('supabaseUrl', supabaseUrl);
      localStorage.setItem('supabaseKey', supabaseKey);
      
      setSupabaseClient(client);
      setShowSetupDialog(false);
      setIsSettingUp(true);

      // Simulate database setup delay
      setTimeout(() => {
        setIsSettingUp(false);
        toast({
          title: "Database Connected",
          description: "Your Supabase project has been successfully connected.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to Supabase. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Check for existing Supabase configuration
    const savedUrl = localStorage.getItem('supabaseUrl');
    const savedKey = localStorage.getItem('supabaseKey');
    
    if (savedUrl && savedKey) {
      setSupabaseUrl(savedUrl);
      setSupabaseKey(savedKey);
      const client = createClient(savedUrl, savedKey);
      setSupabaseClient(client);
      setShowSetupDialog(false);
    }
  }, []);

  if (isSettingUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-fusion-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg text-gray-700">Connecting to your Supabase project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
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
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supabaseKey">Anon Key</Label>
                  <Input
                    id="supabaseKey"
                    type="password"
                    placeholder="your-anon-key"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                  />
                </div>
                <Button onClick={initializeSupabase} className="w-full">
                  Connect to Supabase
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {supabaseClient && (
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-2xl rotate-6 flex items-center justify-center bg-gradient-to-br from-fusion-primary to-fusion-secondary text-white shadow-lg shadow-fusion-primary/20">
                <Bot size={32} />
              </div>
              <h1 className="text-3xl font-bold text-center bg-gradient-to-br from-fusion-primary to-fusion-secondary bg-clip-text text-transparent">
                ThinkLink
              </h1>
              <p className="text-gray-500 text-center max-w-sm">
                Connect with advanced AI models through a unified chat interface
              </p>
            </div>
            <Auth
              supabaseClient={supabaseClient}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#2563EB',
                      brandAccent: '#3B82F6',
                    },
                    radii: {
                      borderRadiusButton: '1rem',
                      buttonBorderRadius: '1rem',
                      inputBorderRadius: '1rem',
                    },
                  },
                },
                className: {
                  button: 'rounded-2xl shadow-lg shadow-fusion-primary/20',
                  input: 'rounded-2xl',
                },
              }}
              theme="light"
              providers={[]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;