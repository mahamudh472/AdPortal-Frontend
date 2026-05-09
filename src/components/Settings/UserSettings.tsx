

import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Building2,
  Link2,
  Bell,
  Shield,
} from "lucide-react";


import Profile from "./Profile";
import BusinessInfo from "./BusinessInfo";
import ConnectedPlatform from "./ConnectedPlatform";
import Notifications from "./Notifications";
import Security from "./Security";

type SettingsTab =
  | "profile"
  | "business"
  | "platforms"
  | "notifications"
  | "security";

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const activeTab: SettingsTab = (
    ["profile", "business", "platforms", "notifications", "security"].includes(tabParam as string)
      ? tabParam
      : "profile"
  ) as SettingsTab;

  const setActiveTab = (tab: SettingsTab) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    });
  };

  return (
    <div className="space-y-6 mt-5">

      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your account settings and preferences
        </p>
      </div>


      <div className="flex flex-wrap gap-2 rounded-xl bg-white border p-2">
        <TabButton
          active={activeTab === "profile"}
          icon={<User size={16} />}
          label="Profile"
          onClick={() => setActiveTab("profile")}
        />

        <TabButton
          active={activeTab === "business"}
          icon={<Building2 size={16} />}
          label="Business Info"
          onClick={() => setActiveTab("business")}
        />

        <TabButton
          active={activeTab === "platforms"}
          icon={<Link2 size={16} />}
          label="Connected Platforms"
          onClick={() => setActiveTab("platforms")}
        />

        <TabButton
          active={activeTab === "notifications"}
          icon={<Bell size={16} />}
          label="Notifications"
          onClick={() => setActiveTab("notifications")}
        />

        <TabButton
          active={activeTab === "security"}
          icon={<Shield size={16} />}
          label="Security"
          onClick={() => setActiveTab("security")}
        />
      </div>

      <div className="rounded-xl border bg-white p-6">
        {activeTab === "profile" && <Profile />}

        {activeTab === "business" && <BusinessInfo />}

        {activeTab === "platforms" && <ConnectedPlatform /> }

        {activeTab === "notifications" &&  <Notifications />}

        {activeTab === "security" && <Security />}
      </div>
    </div>
  );
};

export default Settings;


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
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
        ${
          active
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-50"
        }`}
    >
      {icon}
      {label}
    </button>
  );
};
