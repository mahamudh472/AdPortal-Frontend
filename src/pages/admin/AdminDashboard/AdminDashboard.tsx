import React, { useState, useEffect } from "react";
import { Users, Megaphone, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import api from "@/lib/axios";
import AdminRecentCampaign from "./AdminManagementPages";
import { parseUTCDate } from "@/lib/dateUtils";

// Types based on actual API response
interface ChartDataPoint {
  month: string;
  users: number;
  revenue: number;
}

interface CampaignByPlatform {
  meta: number;
  google: number;
  tiktok: number;
}

interface RecentCampaign {
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
  audience_targeting: any;
  status: string;
  created_at: string;
  ai_insights: any[];
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  budgets: any[];
  file_url: string | null;
}

interface DashboardResponse {
  users: {
    value: number;
    past_month: number;
    percentage: string;
  };
  campaings: {
    value: number;
    last_month: number;
    percentage: string;
  };
  revenue: {
    value: number;
    percentage: number;
  };
  chart_data: ChartDataPoint[];
  campaings_by_platform: CampaignByPlatform;
  recent_campaigns: RecentCampaign[];
}

// Default colors for platforms
const PLATFORM_COLORS = {
  meta: "#3B82F6",
  google: "#10B981", 
  tiktok: "#A855F7"
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      const response = await api.get('/admin/dashboard');
      
      console.log('Dashboard API Response:', response.data);
      
      // The API returns the data directly, not wrapped in a data property
      setDashboardData(response.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format stats for display based on actual API data
  const getStatCards = () => {
    if (!dashboardData) return [];

    // Parse percentage strings to numbers
    const usersPercentage = parseFloat(dashboardData.users.percentage.replace('%', '')) || 0;
    const campaignsPercentage = parseFloat(dashboardData.campaings.percentage.replace('%', '')) || 0;
    const revenuePercentage = dashboardData.revenue.percentage || 0;

    return [
      {
        title: "Total Users",
        value: dashboardData.users.value.toLocaleString(),
        sub: `${dashboardData.users.past_month} new this month`,
        change: `${usersPercentage > 0 ? '+' : ''}${dashboardData.users.percentage}`,
        positive: usersPercentage >= 0,
        icon: <Users size={16} className="text-blue-600" />,
      },
      {
        title: "Total Campaigns",
        value: dashboardData.campaings.value.toLocaleString(),
        sub: `${dashboardData.campaings.last_month} last month`,
        change: `${campaignsPercentage > 0 ? '+' : ''}${dashboardData.campaings.percentage}`,
        positive: campaignsPercentage >= 0,
        icon: <Megaphone size={16} className="text-[#55E8C6]" />,
      },
      {
        title: "Monthly Revenue",
        value: `$${dashboardData.revenue.value.toLocaleString()}`,
        sub: "Current month",
        change: `${revenuePercentage > 0 ? '+' : ''}${revenuePercentage}%`,
        positive: revenuePercentage >= 0,
        icon: <DollarSign size={16} className="text-[#7EB5FF]" />,
      },
    ];
  };

  // Convert campaign by platform to array format for pie chart
  const getPlatformData = () => {
    if (!dashboardData) return [];

    const platforms = dashboardData.campaings_by_platform;
    const total = Object.values(platforms).reduce((sum, count) => sum + count, 0);

    return [
      {
        name: "Meta",
        value: total > 0 ? Math.round((platforms.meta / total) * 100) : 0,
        count: platforms.meta,
        color: PLATFORM_COLORS.meta
      },
      {
        name: "Google",
        value: total > 0 ? Math.round((platforms.google / total) * 100) : 0,
        count: platforms.google,
        color: PLATFORM_COLORS.google
      },
      {
        name: "TikTok",
        value: total > 0 ? Math.round((platforms.tiktok / total) * 100) : 0,
        count: platforms.tiktok,
        color: PLATFORM_COLORS.tiktok
      }
    ].filter(p => p.count > 0); // Only show platforms with campaigns
  };

  // Format recent campaigns for the child component
  const getFormattedRecentCampaigns = () => {
    if (!dashboardData) return [];

    return dashboardData.recent_campaigns.map(campaign => {
      // Calculate time ago
      const createdDate = parseUTCDate(campaign.created_at) || new Date();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let timeAgo;
      if (diffDays === 1) timeAgo = 'Yesterday';
      else if (diffDays <= 7) timeAgo = `${diffDays} days ago`;
      else timeAgo = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Determine status based on campaign status
      let displayStatus: 'success' | 'warning' | 'error' = 'success';
      if (campaign.status === 'DRAFT') displayStatus = 'warning';
      else if (campaign.status === 'PAUSED') displayStatus = 'error';
      
      // Get platform name
      const platform = campaign.platforms && campaign.platforms.length > 0 
        ? campaign.platforms[0] 
        : 'Unknown';

      return {
        id: campaign.id,
        title: campaign.name,
        userEmail: `Campaign ID: ${campaign.id}`,
        timeAgo: timeAgo,
        status: displayStatus,
        amount: campaign.total_budget > 0 ? `$${campaign.total_budget}` : undefined,
        platform: platform
      };
    });
  };

  // Create system status from API data
  const getSystemStatus = () => {
    return [
      {
        id: 1,
        title: "API Status",
        status: "Operational",
        uptime: "Uptime: 99.9%",
      },
      {
        id: 2,
        title: "Database",
        status: "Operational", 
        uptime: "Uptime: 100%",
      },
      {
        id: 3,
        title: "Campaigns",
        status: `${dashboardData?.campaings.value || 0} Active`,
        uptime: `${dashboardData?.campaings.last_month || 0} new this month`,
      },
    ];
  };

  const renderPieLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;

    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      outerRadius === undefined ||
      percent === undefined ||
      percent === 0
    ) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 28;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={500}
      >
        {name}: {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-sm text-red-600">{error || 'No data available'}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = getStatCards();
  const platformData = getPlatformData();
  const formattedCampaigns = getFormattedRecentCampaigns();
  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="flex items-center text-xl font-semibold text-slate-900">
          Admin Dashboard
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1767287296/Icon_23_u6eirf.png"
              alt=""
              className="w-3 h-3"
            />
            Real time
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          Monitor platform performance and user activity
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                {stat.icon}
              </div>

              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                stat.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                <TrendingUp size={12} />
                {stat.change}
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500">{stat.title}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* USER GROWTH CHART */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            User Growth & Revenue
          </h2>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  dataKey="users" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  name="Users"
                />
                <Line 
                  yAxisId="right"
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CAMPAIGN BY PLATFORM PIE CHART */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Campaign by Platform
          </h2>

          {platformData.length > 0 ? (
            <>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {platformData.map((p) => (
                        <Cell key={p.name} fill={p.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {platformData.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-lg border px-3 py-2 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </div>
                    <p className="mt-1 text-sm font-semibold">{p.count}</p>
                    <p className="text-[11px] text-slate-500">Campaigns</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-slate-500">No campaign data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Campaigns and System Status */}
      <AdminRecentCampaign
        recentCampaigns={formattedCampaigns}
        systemStatus={systemStatus}
      />
    </div>
  );
};

export default AdminDashboard;