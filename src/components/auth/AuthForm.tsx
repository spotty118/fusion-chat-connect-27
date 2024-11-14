import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  supabaseClient: SupabaseClient;
  onTestLogin?: () => void;
}

export const AuthForm = ({ supabaseClient, onTestLogin }: AuthFormProps) => {
  const { toast } = useToast();

  return (
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

        {/* Test account button for development */}
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={onTestLogin}
        >
          Sign in with test account
        </Button>

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
          onlyThirdPartyProviders={false}
          redirectTo={`${window.location.origin}/`}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
              },
            },
          }}
          showLinks={true}
          view="sign_in"
        />
      </div>
    </div>
  );
};