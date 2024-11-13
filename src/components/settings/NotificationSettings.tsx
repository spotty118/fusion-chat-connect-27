import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(() => 
    localStorage.getItem('emailNotifications') !== 'false'
  );
  const [desktopNotifications, setDesktopNotifications] = useState(() => 
    localStorage.getItem('desktopNotifications') !== 'false'
  );

  useEffect(() => {
    localStorage.setItem('emailNotifications', String(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('desktopNotifications', String(desktopNotifications));
    
    if (desktopNotifications) {
      // Request notification permission if enabled
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    }
  }, [desktopNotifications]);

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    toast({
      title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
      description: checked ? "You will now receive email updates" : "Email notifications have been turned off",
    });
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