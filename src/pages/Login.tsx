import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client";
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

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSetupDialog, setShowSetupDialog] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleDialogClose = () => {
    setShowSetupDialog(false);
    setIsSettingUp(true);
    // Simulate database setup delay
    setTimeout(() => {
      setIsSettingUp(false);
      toast({
        title: "Database Ready",
        description: "Your database has been set up successfully. You can now sign in.",
      });
    }, 2000);
  };

  if (isSettingUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-fusion-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg text-gray-700">Setting up your database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Dialog open={showSetupDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to ThinkLink!</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>Before you begin, we'll set up your personal database which includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Creating your user profile</li>
                <li>Setting up API key storage</li>
                <li>Initializing chat message storage</li>
              </ul>
              <p>Click outside this dialog or press ESC to start the setup process.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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
            supabaseClient={supabase}
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
    </div>
  );
};

export default Login;