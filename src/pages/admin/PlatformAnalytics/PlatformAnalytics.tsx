import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import {
  Users,
  Activity,
  RefreshCw,
  Calendar,
  ChevronDown,
  Star,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";

// Types
interface UserGrowthItem {
  month: string;
  new_users: number;
  active_users: number;
}

interface FeatureUsageItem {
  feature: string;
  usage: number;
}

interface PlatformAnalyticsData {
  user_growth: UserGrowthItem[];
  feature_usage: FeatureUsageItem[];
}

export interface UserGrowthData {
  month: string;
  newUsers: number;
  activeUsers: number;
}

export interface FeatureUsageData {
  name: string;
  value: number;
}

/* =========================
   SUBCOMPONENTS
 ========================= */

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  bgColor?: string;
  sparkline?: React.ReactNode;
  subText?: string;
}

const StatCard = ({
  icon,
  title,
  value,
  change,
  positive,
  bgColor,
  sparkline,
  subText,
}: StatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor || 'bg-slate-50 text-slate-600'}`}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 leading-none">
            {value}
          </p>
          {change && (
            <p className={`mt-1.5 text-xs font-semibold flex items-center gap-0.5 ${
              positive ? "text-green-600" : "text-slate-400"
            }`}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
          {subText && (
            <p className="mt-1.5 text-xs text-slate-400 font-semibold leading-none">
              {subText}
            </p>
          )}
        </div>
      </div>
      
      {sparkline && (
        <div className="w-20 h-14 flex items-center justify-end">
          {sparkline}
        </div>
      )}
    </div>
  );
};

// Custom Tooltip for Double Area Chart
const CustomGrowthTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-xl flex flex-col gap-1">
        <p className="text-[10px] font-bold text-slate-400">{data.month} 2026</p>
        <p className="text-xs font-bold text-[#3B82F6] flex items-center gap-1.5 leading-none">
          <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
          New Users {data.newUsers}
        </p>
        <p className="text-xs font-bold text-[#10B981] flex items-center gap-1.5 leading-none mt-1">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          Active Users {data.activeUsers}
        </p>
      </div>
    );
  }
  return null;
};

/* =========================
   MAIN COMPONENT
 ========================= */

const PlatformAnalytics: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PlatformAnalyticsData | null>(null);
  void analyticsData;
  
  // Transformed data for charts
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [featureUsageData, setFeatureUsageData] = useState<FeatureUsageData[]>([]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get("/admin/platform-analysis/");
      
      if (response.data) {
        setAnalyticsData(response.data);
        
        // Transform user growth data
        const transformedUserGrowth = response.data.user_growth.map((item: UserGrowthItem) => ({
          month: item.month,
          newUsers: item.new_users,
          activeUsers: item.active_users
        }));
        setUserGrowthData(transformedUserGrowth);
        
        // Transform feature usage data
        const transformedFeatureUsage = response.data.feature_usage.map((item: FeatureUsageItem) => ({
          name: item.feature,
          value: item.usage
        }));
        setFeatureUsageData(transformedFeatureUsage);
      }
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data");
      toast.error(error.response?.data?.message || 'Failed to load analytics data', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  // Sparkline components
  const SparklineBlue = () => (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 23C12 21 18 15 28 14C38 13 42 3 59 1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1 23C12 21 18 15 28 14C38 13 42 3 59 1V24H1V23Z" fill="url(#sparkNewUsers)" opacity="0.1"/>
      <defs>
        <linearGradient id="sparkNewUsers" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );

  const SparklineGreen = () => (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 23C12 21 18 15 28 14C38 13 42 3 59 1" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1 23C12 21 18 15 28 14C38 13 42 3 59 1V24H1V23Z" fill="url(#sparkActiveUsers)" opacity="0.1"/>
      <defs>
        <linearGradient id="sparkActiveUsers" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981"/>
          <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );

  // Dynamic calculations
  const totalNewUsers = userGrowthData.reduce((sum, item) => sum + item.newUsers, 0);
  const avgActiveUsers = userGrowthData.length > 0 
    ? Math.round(userGrowthData.reduce((sum, item) => sum + item.activeUsers, 0) / userGrowthData.length)
    : 0;

  const mostUsedFeature = featureUsageData.length > 0
    ? featureUsageData.reduce((max, item) => item.value > max.value ? item : max, featureUsageData[0])
    : { name: "Campaign Creation", value: 62.5 };

  const activeUsersLatest = userGrowthData.length > 0 
    ? userGrowthData[userGrowthData.length - 1].activeUsers
    : 0;

  if (loading && userGrowthData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Insights and metrics across the platform
            </p>
          </div>
        </div>

        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 animate-pulse h-[100px]" />
          ))}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 animate-pulse h-[320px]" />
      </div>
    );
  }

  if (error && userGrowthData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Insights and metrics across the platform
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-sm font-bold text-slate-950 mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-4">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Insights and metrics across the platform
          </p>
        </div>

        {/* Header controls */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <span>Nov 1 - Apr 30, 2026</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw size={14} className="text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Users size={20} />}
          title="Total New Users (Last 6 months)"
          value={totalNewUsers.toString()}
          change="100.0% vs previous 6 months"
          positive={true}
          bgColor="bg-blue-50 text-blue-600"
          sparkline={<SparklineBlue />}
        />
        <StatCard
          icon={<Activity size={20} />}
          title="Avg. Active Users"
          value={avgActiveUsers.toString()}
          change="100.0% vs previous 6 months"
          positive={true}
          bgColor="bg-green-50 text-green-600"
          sparkline={<SparklineGreen />}
        />
        <StatCard
          icon={<Star size={20} />}
          title="Most Used Feature"
          value={mostUsedFeature.name}
          subText={`Used by ${mostUsedFeature.value}% of users`}
          bgColor="bg-purple-50 text-indigo-600"
          sparkline={
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600"
                  strokeWidth="3.5"
                  strokeDasharray={`${mostUsedFeature.value}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-[9px] font-extrabold text-slate-800">
                {mostUsedFeature.value}%
              </div>
            </div>
          }
        />
      </div>

      {/* USER GROWTH PLOTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart (col-span-2) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 leading-snug">User Growth</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">New vs Active users over time</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 mr-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
                  New Users
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  Active Users
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm">
                <span>Last 6 Months</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm">
                <span>Monthly</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
            </div>
          </div>

          <div className="h-64 mt-4">
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <Tooltip content={<CustomGrowthTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                    activeDot={{ r: 5, fill: "#3B82F6", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorActive)"
                    activeDot={{ r: 5, fill: "#10B981", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                No user growth data available
              </div>
            )}
          </div>
        </div>

        {/* User Growth Summary (concentric dotted rings) (col-span-1) */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 leading-snug">User Growth Summary</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Comparison summary for the selected period</p>
          </div>

          <div className="flex items-center gap-6 mt-4 flex-1">
            {/* Concentric rings graphic */}
            <div className="w-28 h-28 flex items-center justify-center flex-shrink-0 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="26" stroke="#F1F5F9" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                <circle cx="72.5" cy="37" r="4.5" fill="#10B981" />

                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                <circle cx="77" cy="23.5" r="4.5" fill="#3B82F6" />

                <circle cx="50" cy="50" r="16" fill="#EFF6FF" />
              </svg>
              <div className="absolute flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            {/* Stats list */}
            <div className="flex-1 space-y-3.5">
              {/* New Users */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 leading-none">New Users</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 leading-none">
                    {totalNewUsers}{" "}
                    <span className="text-[10px] font-bold text-green-600 ml-1.5">↑ 100.0%</span>
                  </p>
                </div>
              </div>

              {/* Active Users */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 leading-none">Active Users</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 leading-none">
                    {activeUsersLatest}{" "}
                    <span className="text-[10px] font-bold text-green-600 ml-1.5">↑ 87.5%</span>
                  </p>
                </div>
              </div>

              {/* Churned Users */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 leading-none">Churned Users</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 leading-none">
                    0{" "}
                    <span className="text-[10px] font-bold text-slate-400 ml-1.5">- 0%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE USAGE CHART CARD */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 leading-snug">Feature Usage (%)</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Distribution of feature usage across the platform</p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm">
            <span>Last 6 Months</span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>
        </div>

        {featureUsageData.length > 0 ? (
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureUsageData}
                layout="vertical"
                margin={{ left: 20, right: 40, top: 10, bottom: 10 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]} 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                />
                <Tooltip
                  formatter={(value) => {
                    const usage = typeof value === "number" ? value : Number(value ?? 0);
                    return [`${usage}%`, "Usage"];
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#6366F1"
                  radius={[0, 6, 6, 0]}
                  name="Usage %"
                >
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={(v: any) => `${v}%`} 
                    style={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-semibold">
            No feature usage data available
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformAnalytics;