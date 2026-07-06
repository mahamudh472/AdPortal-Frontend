import React, { useState } from "react";
import {
  ShieldCheck,
  Bell,
} from "lucide-react";
import Security from "./Security";
import SettingNotification from "./SettingNotification";

type AdminSettingsTab =
  | "security"
  | "notifications";

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] =
    useState<AdminSettingsTab>("security");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Admin Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Configure platform-wide settings
        </p>
      </div>

      {/* Tabs list switch */}
      <div className="flex gap-1.5 rounded-2xl border border-slate-200/60 bg-slate-50 p-1 w-fit shadow-xs">
        <TabButton
          active={activeTab === "security"}
          icon={<ShieldCheck size={15} />}
          label="Security"
          onClick={() => setActiveTab("security")}
        />

        <TabButton
          active={activeTab === "notifications"}
          icon={<Bell size={15} />}
          label="Notifications"
          onClick={() => setActiveTab("notifications")}
        />
      </div>

      {/* Content wrapper */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        {activeTab === "security" && <Security />}
        {activeTab === "notifications" && (
          <SettingNotification />
        )}
      </div>
    </div>
  );
};

export default AdminSettings;

type TabButtonProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

const TabButton: React.FC<TabButtonProps> = ({
  active,
  icon,
  label,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer
        ${
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};