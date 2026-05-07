import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Users, Activity, RefreshCw } from "lucide-react";
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

// Transformed types for charts
export interface UserGrowthData {
  month: string;
  newUsers: number;
  activeUsers: number;
}

export interface FeatureUsageData {
  name: string;
  value: number;
}

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
        
        // toast.success('Analytics data loaded successfully', {
        //   duration: 3000,
        //   position: 'top-center',
        // });
      }
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data");
      
      // Show error toast
      toast.error(error.response?.data?.message || 'Failed to load analytics data', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-500">
              Insights and metrics across the platform
            </p>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="rounded-xl border bg-white p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-slate-100 rounded"></div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-500">
              Insights and metrics across the platform
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>

        <div className="rounded-xl border bg-white p-12 text-center">
          <div className="text-slate-400 mb-3">
            <Activity size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Platform Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Insights and metrics across the platform
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>


         {userGrowthData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Users size={16} />
              <span className="text-xs font-medium">Total New Users (Last 6 months)</span>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {userGrowthData.reduce((sum, item) => sum + item.newUsers, 0)}
            </p>
          </div>
          
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Activity size={16} />
              <span className="text-xs font-medium">Avg. Active Users</span>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {Math.round(userGrowthData.reduce((sum, item) => sum + item.activeUsers, 0) / userGrowthData.length)}
            </p>
          </div>
          
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <span className="text-xs font-medium">Most Used Feature</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {featureUsageData.length > 0 
                ? featureUsageData.reduce((max, item) => item.value > max.value ? item : max, featureUsageData[0]).name
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      

      {/* USER GROWTH CHART */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            User Growth
          </h2>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              New Users
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active Users
            </span>
            <span className="rounded-md border px-2 py-1">
              Monthly
            </span>
          </div>
        </div>

        {userGrowthData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="New Users"
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No user growth data available
          </div>
        )}
      </div>

      {/* FEATURE USAGE CHART */}


      
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Feature Usage (%)
        </h2>

        {featureUsageData.length > 0 ? (
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureUsageData}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => {
                    const usage = typeof value === "number" ? value : Number(value ?? 0);

                    return [`${usage}%`, "Usage"];
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#2563EB"
                  radius={[0, 6, 6, 0]}
                  name="Usage %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No feature usage data available
          </div>
        )}
      </div>

      {/* Summary Stats (Optional) */}
   
    </div>
  );
};

export default PlatformAnalytics;