import React from "react";
import { Link } from "react-router";
import { formatToLocalDateTime } from "@/lib/dateUtils";


type Campaign = {
  id: number;
  name: string;
  objective: string;
  platforms: string[];
  matrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    roas: number;
    cpc: number;
    cpm: number;
    cpa: number;
  };
  ads: any[];
  audience_targeting: {
    min_age: number;
    max_age: number;
    gender: string;
    locations: string[];
    keywords: string;
  };
  status: string;
  created_at: string;
  ai_insights: any[];
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  platform_sync_statuses?: Record<string, {
    operation: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    message: string;
    error_message: string | null;
    updated_at: string;
  }>;
};

type CampaignsOverviewProps = {
  campaign: Campaign;
};

const CampaignsOverview: React.FC<CampaignsOverviewProps> = ({ campaign }) => {
  if (!campaign) return <div className="bg-white rounded-lg p-8 text-center max-w-md mx-auto my-10 shadow-sm border border-gray-200">
  <div className="mb-4">
    {/* Empty state icon */}
    <svg 
      className="w-16 h-16 mx-auto text-gray-300" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="1.5" 
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  </div>
  
  <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Found</h3>
  
  <p className="text-gray-500 text-sm mb-6">
    You haven't created any campaigns yet. Get started by creating your first campaign.
  </p>
  
 <Link to="/user-dashboard/campaigns-create/step-1" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
    + Create New Campaign
  </Link>
</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/user-dashboard/campaigns" className="mb-2 text-sm text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">
            {campaign.name}
          </h1>
          <p className="text-sm text-slate-500">
            Campaign Details & Performance
          </p>
        </div>
        <Link 
          to={`/user-dashboard/campaigns-update/${campaign.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Campaign
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Campaign Overview
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${campaign.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {campaign.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Objective</p>
            <p className="text-sm font-medium text-slate-900">
              {campaign.objective}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Platforms</p>
            <div className="mt-1 flex gap-2">
              {campaign.platforms.map((platform) => (
                <span key={platform} className="rounded-full border px-2 py-0.5 text-xs">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Created At</p>
            <p className="text-sm font-medium text-slate-900">
              {formatToLocalDateTime(campaign.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Budget</p>
            <p className="text-sm font-semibold text-slate-900">
              ${campaign.total_budget}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Spend</p>
            <p className="text-sm font-semibold text-slate-900">
              ${campaign.total_spent}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Remaining Budget</p>
            <p className="text-sm font-semibold text-slate-900">
              ${campaign.remaining_budget}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(campaign.matrics).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{label.charAt(0).toUpperCase() + label.slice(1)}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignsOverview;


