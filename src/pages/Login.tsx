import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Bot } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
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