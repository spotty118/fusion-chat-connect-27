import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { useState } from "react";

export const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);

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
            onCheckedChange={setEmailNotifications}
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
            onCheckedChange={setDesktopNotifications}
          />
        </div>
      </div>
    </div>
  );
};