import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(() => 
    localStorage.getItem('desktopNotifications') === 'true'
  );

  // Load user's email notification preference from Supabase
  useEffect(() => {
    const loadEmailPreference = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_notifications')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setEmailNotifications(profile.email_notifications || false);
        }
      }
    };
    
    loadEmailPreference();
  }, []);

  useEffect(() => {
    localStorage.setItem('desktopNotifications', String(desktopNotifications));
    
    if (desktopNotifications) {
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    }
  }, [desktopNotifications]);

  const handleEmailNotificationsChange = async (checked: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: checked })
        .eq('id', session.user.id);

      if (!error) {
        setEmailNotifications(checked);
        toast({
          title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
          description: checked ? "You will now receive email updates" : "Email notifications have been turned off",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update email notification settings",
          variant: "destructive",
        });
      }
    }
  };

  const handleDesktopNotificationsChange = async (checked: boolean) => {
    if (checked && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return;
      }
    }
    
    setDesktopNotifications(checked);
    toast({
      title: checked ? "Desktop Notifications Enabled" : "Desktop Notifications Disabled",
      description: checked ? "You will now receive desktop notifications" : "Desktop notifications have been turned off",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Bell className="h-5 w-5" />
        <Label>Notifications</Label>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email updates about your conversations
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationsChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Desktop Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show desktop notifications for new messages
            </p>
          </div>
          <Switch
            checked={desktopNotifications}
            onCheckedChange={handleDesktopNotificationsChange}
          />
        </div>
      </div>
    </div>
  );
};