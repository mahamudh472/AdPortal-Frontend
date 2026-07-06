import api from "@/lib/axios";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

type ToggleItem = {
  id: string;
  title: string;
  description: string;
  apiKey: string; 
};

const NOTIFICATIONS: ToggleItem[] = [
  {
    id: "new_users",
    title: "New User Signups",
    description: "Get notified when new users register",
    apiKey: "new_user_signup",
  },
  {
    id: "failed_payments",
    title: "Failed Payments",
    description: "Alert when payment processing fails",
    apiKey: "failed_payment",
  },
  {
    id: "system_errors",
    title: "System Errors",
    description: "Critical system error notifications",
    apiKey: "system_errors",
  },
  {
    id: "security_alerts",
    title: "Security Alerts",
    description: "Suspicious activity warnings",
    apiKey: "security_alerts",
  },
];

const SettingNotification: React.FC = () => {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    new_users: true,
    failed_payments: true,
    system_errors: true,
    security_alerts: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch notification settings on component mount
  useEffect(() => {
    fetchNotificationSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotificationSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/notification-settings/");
      
      if (response.data) {
        const settings = response.data;
        
        setEnabled({
          new_users: settings.new_user_signup ?? true,
          failed_payments: settings.failed_payment ?? true,
          system_errors: settings.system_errors ?? true,
          security_alerts: settings.security_alerts ?? true,
        });
      }
    } catch (error: any) {
      console.error("Error fetching notification settings:", error);
      
      if (!initialLoad || error.response?.status !== 404) {
        toast.error("Failed to load notification settings");
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const saveNotificationSetting = async (id: string, value: boolean) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    
    try {
      const notification = NOTIFICATIONS.find(n => n.id === id);
      if (!notification) return;

      const settingsData = {
        new_user_signup: enabled.new_users,
        failed_payment: enabled.failed_payments,
        system_errors: enabled.system_errors,
        security_alerts: enabled.security_alerts,
      };

      settingsData[notification.apiKey as keyof typeof settingsData] = value;

      const response = await api.put("/admin/notification-settings/", settingsData);
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`${notification.title} ${value ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error: any) {
      console.error("Error saving notification setting:", error);
      setEnabled(prev => ({ ...prev, [id]: !value }));
      toast.error("Failed to save notification setting");
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggle = async (id: string) => {
    const newValue = !enabled[id];
    setEnabled((prev) => ({ ...prev, [id]: newValue }));
    await saveNotificationSetting(id, newValue);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Notification Preferences
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Configure how you receive alerts and status summaries
          </p>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
                <div className="h-3 w-48 bg-slate-100 rounded"></div>
              </div>
              <div className="h-5 w-9 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Notification Preferences
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Configure how you receive alerts and status summaries
        </p>
      </div>

      <div className="space-y-3 max-w-xl">
        {NOTIFICATIONS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/20 px-5 py-4 transition-colors duration-200"
          >
            <div>
              <p className="text-xs font-bold text-slate-800">
                {item.title}
              </p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {item.description}
              </p>
            </div>

            {/* Toggle Switch knob animation */}
            <button
              onClick={() => toggle(item.id)}
              disabled={saving[item.id]}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                enabled[item.id] ? "bg-blue-600" : "bg-slate-200"
              } ${saving[item.id] ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saving[item.id] ? (
                <div className="absolute top-1 left-3 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                </div>
              ) : (
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    enabled[item.id] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-5 max-w-xl border-t border-slate-100">
        <button
          onClick={fetchNotificationSettings}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default SettingNotification;
