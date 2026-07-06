import React from "react";
import { Layers, Database, Megaphone, Activity } from "lucide-react";
import type { RecentCampaignItem, SystemStatusItem } from "@/types/admin.types";

interface AdminRecentCampaignProps {
  recentCampaigns: RecentCampaignItem[];
  systemStatus: SystemStatusItem[];
}

const MetaLogoSmall = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#0064E0" className="flex-shrink-0">
    <path d="M12 17.227c-1.632-1.96-3.13-3.69-4.834-5.46-2.585-2.69-5.166-.347-5.166 2.91 0 3.393 2.996 6.323 6.945 6.323 2.143 0 3.864-1.077 4.9-2.06 1.036.983 2.757 2.06 4.9 2.06 3.95 0 6.945-2.93 6.945-6.323 0-3.257-2.58-5.6-5.166-2.91-1.704 1.77-3.202 3.5-4.834 5.46zm-4.7-2.615c.677.72 1.34 1.474 2 2.227-1.127.973-2.457 1.474-3.7 1.474-2.316 0-4.1-1.785-4.1-4.086 0-2.3 1.784-4.085 4.1-4.085 1.784 0 3.23 1.39 4.1 2.87-.76 1.054-1.532 2.108-2.4 2.6zM18.7 14.612c-.868-.492-1.64-1.546-2.4-2.6.87-1.48 2.316-2.87 4.1-2.87 2.316 0 4.1 1.785 4.1 4.085 0 2.3-1.784 4.086-4.1 4.086-1.243 0-2.573-.5-3.7-1.474.66-.753 1.323-1.507 2-2.227z"/>
  </svg>
);

const GoogleLogoSmall = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" className="flex-shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

const TikTokLogoSmall = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#000000" className="flex-shrink-0">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.17.96 1.15 2.27 1.95 3.74 2.28v3.91c-1.37-.02-2.69-.38-3.85-1.04-.66-.38-1.25-.87-1.74-1.46v6.17c.05 1.63-.4 3.24-1.29 4.6-1.57 2.4-4.39 3.73-7.25 3.33-2.86-.4-5.32-2.47-6.22-5.2C.5 13.93 1.34 10.74 3.59 8.9c1.88-1.54 4.46-2.1 6.84-1.47v3.93c-1.12-.47-2.39-.36-3.41.29-.98.63-1.57 1.73-1.57 2.89.01 1.39.81 2.65 2.07 3.2 1.25.56 2.71.3 3.7-.65.73-.7 1.07-1.7 1.01-2.7V.02h.295z"/>
  </svg>
);

const renderPlatformIcon = (platform?: string) => {
  const normPlatform = platform?.toLowerCase() || '';
  let logo = <Megaphone className="w-4 h-4 text-slate-500" />;
  let bg = 'bg-slate-50';

  if (normPlatform.includes('meta') || normPlatform.includes('facebook') || normPlatform.includes('instagram')) {
    logo = <MetaLogoSmall />;
    bg = 'bg-blue-50';
  } else if (normPlatform.includes('google')) {
    logo = <GoogleLogoSmall />;
    bg = 'bg-slate-50 border border-slate-100';
  } else if (normPlatform.includes('tiktok')) {
    logo = <TikTokLogoSmall />;
    bg = 'bg-slate-50';
  }

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
      {logo}
    </div>
  );
};

const renderStatusBadge = (status: RecentCampaignItem["status"]) => {
  let text = 'Active';
  let badgeStyle = 'bg-green-50 text-green-700 border border-green-100';

  if (status === 'warning') {
    text = 'Draft';
    badgeStyle = 'bg-yellow-50 text-yellow-700 border border-yellow-100';
  } else if (status === 'error') {
    text = 'Paused';
    badgeStyle = 'bg-red-50 text-red-700 border border-red-100';
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
      {text}
    </span>
  );
};

const getSystemIcon = (title: string) => {
  switch (title) {
    case "API Status":
      return <Layers className="w-5 h-5" />;
    case "Database":
      return <Database className="w-5 h-5" />;
    case "Active Campaigns":
    case "Campaigns":
      return <Megaphone className="w-5 h-5" />;
    default:
      return <Layers className="w-5 h-5" />;
  }
};

const AdminRecentCampaign: React.FC<AdminRecentCampaignProps> = ({ 
  recentCampaigns, 
  systemStatus 
}) => {
  if (!recentCampaigns?.length && !systemStatus?.length) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-8">
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">No recent activity found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recent Campaigns Section */}
      {recentCampaigns && recentCampaigns.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Campaigns
              </h2>
              <span className="bg-slate-50 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-100">
                {recentCampaigns.length} total
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {recentCampaigns.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4.5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {renderPlatformIcon(item.platform)}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </p>
                      {renderStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                      <span>{item.userEmail}</span>
                      {item.platform && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span>Platform: {item.platform}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.amount && (
                    <span className="font-bold text-green-600 text-sm bg-green-50/50 px-2.5 py-1 rounded-lg border border-green-50">
                      {item.amount}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-medium">{item.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status Section */}
      {systemStatus && systemStatus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systemStatus.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50/70 text-blue-600 flex items-center justify-center flex-shrink-0">
                  {getSystemIcon(item.title)}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    {item.title}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900 leading-none">
                    {item.status}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 font-medium leading-none">
                    {item.uptime}
                  </p>
                </div>
              </div>

              {/* Pulse Wave Icon */}
              <Activity className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRecentCampaign;