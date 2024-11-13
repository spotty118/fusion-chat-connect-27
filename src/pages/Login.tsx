import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { SetupDialog } from '@/components/auth/SetupDialog';
import { AuthForm } from '@/components/auth/AuthForm';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('supabaseUrl');
    const savedKey = localStorage.getItem('supabaseKey');
    
    if (savedUrl && savedKey) {
      const client = createClient(savedUrl, savedKey);
      setSupabaseClient(client);

      // Check if user is already logged in
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/');
        }
      });
    } else {
      setShowSetupDialog(true);
    }
  }, [navigate]);

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

  const handleSkipSetup = () => {
    const defaultUrl = 'https://ialfzzyffpruxifznfhz.supabase.co';
    const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbGZ6enlmZnBydXhpZnpuZmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyOTQwODcsImV4cCI6MjA0Njg3MDA4N30.JtRU3ZimPQK06frPFNOMzBhFEubEKU1DA7uZfAPmp8k';
    
    localStorage.setItem('supabaseUrl', defaultUrl);
    localStorage.setItem('supabaseKey', defaultKey);
    
    const client = createClient(defaultUrl, defaultKey);
    setSupabaseClient(client);
    setShowSetupDialog(false);
  };

  const handleTestLogin = async () => {
    if (!supabaseClient) return;
    
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123',
      });
      
      if (error) throw error;
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Please create a test account first with email: test@example.com and password: testpassword123",
        variant: "destructive"
      });
    }
  };

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
      <SetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        supabaseUrl={supabaseUrl}
        supabaseKey={supabaseKey}
        onUrlChange={setSupabaseUrl}
        onKeyChange={setSupabaseKey}
        onInitialize={initializeSupabase}
        onSkipSetup={handleSkipSetup}
      />

      {supabaseClient && (
        <AuthForm 
          supabaseClient={supabaseClient}
          onTestLogin={handleTestLogin}
        />
      )}
    </div>
  );
};

export default Login;