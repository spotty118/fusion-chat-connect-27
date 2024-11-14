import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { SetupDialog } from '@/components/auth/SetupDialog';
import { AuthForm } from '@/components/auth/AuthForm';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/');
        }
      } catch (err) {
        console.error('Supabase connection error:', err);
        setError('Failed to connect to the database. Please try again later.');
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to connect to the database. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [navigate, toast]);

  const handleTestLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123',
      });
      
      if (error) throw error;
      
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Please create a test account first with email: test@example.com and password: testpassword123",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-fusion-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg text-gray-700">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-fusion-primary text-white rounded-lg hover:bg-fusion-secondary transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <AuthForm 
        supabaseClient={supabase}
        onTestLogin={handleTestLogin}
      />
    </div>
  );
};

export default Login;