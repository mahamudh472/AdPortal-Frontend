import React, { useState, useEffect } from "react";
import { Users, Megaphone, DollarSign, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
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

interface TrendData {
  direction: "up" | "down" | "neutral";
  sparkline: number[];
}

interface RecentCampaign {
  id: number;
  name: string;
  status: string;
  platforms: string[];
  created_at: string;
}

interface SystemStatusItem {
  status: string;
  uptime_percent: number;
}

interface DashboardResponse {
  users: {
    value: number;
    past_month: number;
    percentage: string;
    trend?: TrendData;
  };
  campaings: {
    value: number;
    last_month: number;
    percentage: string;
    trend?: TrendData;
  };
  revenue: {
    value: number;
    percentage: number;
    trend?: TrendData;
  };
  chart_data: ChartDataPoint[];
  campaings_by_platform: CampaignByPlatform;
  recent_campaigns: RecentCampaign[];
  system_status?: {
    api: SystemStatusItem;
    database: SystemStatusItem;
  };
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
        platform: platform
      };
    });
  };

  // Create system status from API data
  const getSystemStatus = () => {
    const apiStatus = dashboardData?.system_status;
    return [
      {
        id: 1,
        title: "API Status",
        status: apiStatus?.api?.status === "operational" ? "Operational" : (apiStatus?.api?.status || "Operational"),
        uptime: `Uptime: ${apiStatus?.api?.uptime_percent ?? 99.9}%`,
      },
      {
        id: 2,
        title: "Database",
        status: apiStatus?.database?.status === "operational" ? "Operational" : (apiStatus?.database?.status || "Operational"),
        uptime: `Uptime: ${apiStatus?.database?.uptime_percent ?? 100}%`,
      },
      {
        id: 3,
        title: "Active Campaigns",
        status: `${dashboardData?.campaings.value || 0} Active`,
        uptime: `${dashboardData?.campaings.last_month || 0} new this month`,
      },
    ];
  };

  // Brand logos
  const MetaLogo = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
      <path d="M9.101 23.656V12.234H5.721V8.472h3.38V5.607c0-3.292 2.002-5.084 4.935-5.084 1.405 0 2.612.104 2.964.15v3.437h-2.035c-1.597 0-1.905.76-1.905 1.87v2.45h3.805l-.493 3.762h-3.312v11.464H9.101z"/>
    </svg>
  );

  const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );

  const TikTokLogo = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.17.96 1.15 2.27 1.95 3.74 2.28v3.91c-1.37-.02-2.69-.38-3.85-1.04-.66-.38-1.25-.87-1.74-1.46v6.17c.05 1.63-.4 3.24-1.29 4.6-1.57 2.4-4.39 3.73-7.25 3.33-2.86-.4-5.32-2.47-6.22-5.2C.5 13.93 1.34 10.74 3.59 8.9c1.88-1.54 4.46-2.1 6.84-1.47v3.93c-1.12-.47-2.39-.36-3.41.29-.98.63-1.57 1.73-1.57 2.89.01 1.39.81 2.65 2.07 3.2 1.25.56 2.71.3 3.7-.65.73-.7 1.07-1.7 1.01-2.7V.02h.295z"/>
    </svg>
  );

  // Dynamic sparkline component that renders from API data points
  const DynamicSparkline = ({ data, color = "#10B981" }: { data?: number[]; color?: string }) => {
    if (!data || data.length < 2) {
      // Flat line fallback
      return (
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
          <path d="M1 6H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }

    const width = 22;
    const height = 12;
    const padding = 1;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x} ${y}`;
    });

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
        <polyline
          points={points.join(", ")}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  };

  // Helper to get trend badge styles and text from API data
  const getTrendBadge = (percentage: string | number, direction?: string) => {
    const pctStr = typeof percentage === 'number' ? `${percentage}%` : percentage;
    const isUp = direction === 'up';
    const isDown = direction === 'down';
    const isNeutral = !isUp && !isDown;

    const bgClass = isDown
      ? 'bg-red-50 text-red-600 border-red-100'
      : isNeutral
        ? 'bg-slate-50 text-slate-500 border-slate-100'
        : 'bg-green-50 text-green-600 border-green-100';

    const color = isDown ? '#EF4444' : isNeutral ? '#64748B' : '#10B981';
    const prefix = isUp && !pctStr.startsWith('+') && !pctStr.startsWith('-') ? '+' : '';

    return { bgClass, displayText: `${prefix}${pctStr}`, color };
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
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-bold text-xs md:text-sm"
      >
        <tspan x={x} dy="-6">{name}</tspan>
        <tspan x={x} dy="16" fontSize="13">{(percent * 100).toFixed(0)}%</tspan>
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

  const platformData = getPlatformData();
  const formattedCampaigns = getFormattedRecentCampaigns();
  const systemStatus = getSystemStatus();

  // Use chart data directly from API (backend now always returns populated data)
  const chartData = dashboardData.chart_data && dashboardData.chart_data.length > 0
    ? dashboardData.chart_data
    : [];

  const totalCampaigns = dashboardData.campaings_by_platform
    ? Object.values(dashboardData.campaings_by_platform).reduce((sum, count) => sum + count, 0)
    : 0;

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
        <p className="text-sm text-slate-500 mt-0.5">
          Monitor platform performance and user activity
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Users */}
        {(() => {
          const userTrend = getTrendBadge(dashboardData.users.percentage, dashboardData.users.trend?.direction);
          return (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-500">Total Users</p>
                  <p className="mt-1 text-[26px] font-bold text-slate-900 leading-none">
                    {dashboardData.users.value.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 font-medium">
                    {dashboardData.users.past_month} new this month
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 self-start pt-1">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${userTrend.bgClass}`}>
                  <DynamicSparkline data={dashboardData.users.trend?.sparkline} color={userTrend.color} />
                  {userTrend.displayText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">vs last month</span>
              </div>
            </div>
          );
        })()}

        {/* Card 2: Total Campaigns */}
        {(() => {
          const campTrend = getTrendBadge(dashboardData.campaings.percentage, dashboardData.campaings.trend?.direction);
          return (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-500">Total Campaigns</p>
                  <p className="mt-1 text-[26px] font-bold text-slate-900 leading-none">
                    {dashboardData.campaings.value.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 font-medium">
                    {dashboardData.campaings.last_month} last month
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 self-start pt-1">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${campTrend.bgClass}`}>
                  <DynamicSparkline data={dashboardData.campaings.trend?.sparkline} color={campTrend.color} />
                  {campTrend.displayText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">vs last month</span>
              </div>
            </div>
          );
        })()}

        {/* Card 3: Monthly Revenue */}
        {(() => {
          const revPct = dashboardData.revenue.percentage;
          const revTrend = getTrendBadge(`${revPct}%`, dashboardData.revenue.trend?.direction);
          return (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-500">Monthly Revenue</p>
                  <p className="mt-1 text-[26px] font-bold text-slate-900 leading-none">
                    ${dashboardData.revenue.value.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 font-medium">
                    Current month
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 self-start pt-1">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${revTrend.bgClass}`}>
                  <DynamicSparkline data={dashboardData.revenue.trend?.sparkline} color={revTrend.color} />
                  {revTrend.displayText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">vs last month</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* USER GROWTH CHART */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-[15px] font-bold text-slate-900">User Growth & Revenue</h2>
              
              {/* Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-0.5 bg-[#3B82F6] relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  </span>
                  <span className="text-xs font-semibold text-slate-600">Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-0.5 bg-[#10B981] relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  </span>
                  <span className="text-xs font-semibold text-slate-600">Revenue (USD)</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm">
                  <span>Last 6 Months</span>
                  <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm">
                  <span>Monthly</span>
                  <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="h-[260px] relative">
              {/* Y-Axes labels */}
              <span className="text-[10px] font-bold text-slate-400 absolute left-8 -top-3">Users</span>
              <span className="text-[10px] font-bold text-slate-400 absolute right-8 -top-3">Revenue (USD)</span>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -10, right: -10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                    dy={8}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 14000]}
                    ticks={[0, 3500, 7000, 10500, 14000]}
                    tickFormatter={(v) => v === 0 ? "0" : v >= 1000 ? `${v / 1000}K` : v}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 14000]}
                    ticks={[0, 3500, 7000, 10500, 14000]}
                    tickFormatter={(v) => v === 0 ? "0" : v >= 1000 ? `${v / 1000}K` : v}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="users"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff', stroke: '#3B82F6' }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#3B82F6' }}
                    name="Users"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff', stroke: '#10B981' }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#10B981' }}
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Under-chart Summary Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Total Users */}
            {(() => {
              const userTrend = getTrendBadge(dashboardData.users.percentage, dashboardData.users.trend?.direction);
              return (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-500">Total Users</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {dashboardData.users.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border scale-90 origin-right ${userTrend.bgClass}`}>
                      <DynamicSparkline data={dashboardData.users.trend?.sparkline} color={userTrend.color} />
                      {userTrend.displayText}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
                  </div>
                </div>
              );
            })()}

            {/* Card 2: Total Revenue */}
            {(() => {
              const revPct = dashboardData.revenue.percentage;
              const revTrend = getTrendBadge(`${revPct}%`, dashboardData.revenue.trend?.direction);
              return (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-500">Total Revenue</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        ${dashboardData.revenue.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border scale-90 origin-right ${revTrend.bgClass}`}>
                      <DynamicSparkline data={dashboardData.revenue.trend?.sparkline} color={revTrend.color} />
                      {revTrend.displayText}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* CAMPAIGN BY PLATFORM PIE CHART */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-6 text-[15px] font-bold text-slate-900">
              Campaigns by Platform
            </h2>

            {platformData.length > 0 ? (
              <div className="relative flex justify-center items-center h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      strokeWidth={3}
                      stroke="#fff"
                      paddingAngle={2}
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {platformData.map((p) => (
                        <Cell key={p.name} fill={p.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-slate-900 leading-tight my-0.5">{totalCampaigns}</span>
                  <span className="text-xs font-semibold text-slate-500">Campaigns</span>
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-sm text-slate-500">No campaign data available</p>
              </div>
            )}
          </div>

          {/* Platform breakdown cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {/* Card 1: Meta */}
            <div className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center flex-shrink-0 bg-slate-50">
                <MetaLogo />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-500 leading-none">Meta</p>
                <p className="text-lg font-bold text-slate-900 mt-1.5 leading-none">
                  {dashboardData.campaings_by_platform.meta}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Campaigns</p>
              </div>
            </div>

            {/* Card 2: Google */}
            <div className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center flex-shrink-0 bg-slate-50">
                <GoogleLogo />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-500 leading-none">Google</p>
                <p className="text-lg font-bold text-slate-900 mt-1.5 leading-none">
                  {dashboardData.campaings_by_platform.google}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Campaigns</p>
              </div>
            </div>

            {/* Card 3: TikTok */}
            <div className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center flex-shrink-0 bg-slate-50">
                <TikTokLogo />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-500 leading-none">TikTok</p>
                <p className="text-lg font-bold text-slate-900 mt-1.5 leading-none">
                  {dashboardData.campaings_by_platform.tiktok}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Campaigns</p>
              </div>
            </div>
          </div>
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