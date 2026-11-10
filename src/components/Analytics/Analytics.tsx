import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Eye,
  Target,
  TrendingUp,
  RefreshCw,
  MousePointer,
  Calendar,
  ChevronDown,
  BarChart2,
} from "lucide-react";
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
  BarChart,
  Bar,
} from "recharts";
import api from "../../lib/axios";

// Types
interface MetricValue {
  value: number;
  change_percent: number;
  /** Last 6 calendar months, oldest first. */
  sparkline?: number[];
}

interface InsightHighlight {
  platform: string;
  label: string;
  value: string;
}

interface InsightsSummary {
  top_performing_platform: InsightHighlight | null;
  most_conversions_platform: InsightHighlight | null;
  best_click_rate_platform: InsightHighlight | null;
  lowest_cost_per_conversion: InsightHighlight | null;
}

interface DevicePerformanceMap {
  [device: string]: { clicks: number; impressions: number };
}

interface TopMetrics {
  total_spend: MetricValue;
  impressions: MetricValue;
  click_rate: MetricValue;
  conversions: MetricValue;
}

interface MonthlyData {
  clicks: number;
  conversions: number;
  impressions: number;
}

interface MonthlyPerformance {
  [key: string]: MonthlyData;
}

interface SpendByPlatform {
  META: number;
  GOOGLE: number;
  TIKTOK: number;
}

interface AnalyticsData {
  top_metrics: TopMetrics;
  monthly_performance: MonthlyPerformance;
  spend_by_platform: SpendByPlatform;
  device_performance?: DevicePerformanceMap;
  insights_summary?: InsightsSummary;
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
  sparklineColor: string;
  sparkline: number[];
}

export interface PlatformSpend {
  name: "Meta" | "Google" | "TikTok";
  value: number;
  color: string;
  [key: string]: any;
}

export interface MonthlyPerformanceData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface DeviceData {
  device: string;
  impressions: number;
  clicks: number;
}

// Sparkline for the stat cards, drawn from the real monthly series (viewBox 60 x 20).
const CardSparklineWave = ({ color = "#2563eb", data }: { color?: string; data: number[] }) => {
  const hasData = data.length > 1 && data.some((v) => v > 0);
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = hasData
    ? data.map((v, i) => `${(i / (data.length - 1)) * 60},${17 - ((v - min) / range) * 14}`).join(" ")
    : "0,17 60,17";

  return (
    <div className="w-16 h-6 overflow-hidden relative" title="Last 6 months">
      <svg className="w-full h-full" viewBox="0 0 60 20" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={hasData ? color : "#cbd5e1"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const PLATFORM_COLORS = {
  META: "#3B82F6",
  GOOGLE: "#10B981",
  TIKTOK: "#A855F7",
};

const CHART_TIMEFRAMES = ["7D", "30D", "3M", "6M", "1Y"];

const formatChange = (percent: number) => `${percent >= 0 ? "+" : ""}${percent}%`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs space-y-1">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-semibold">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span style={{ color: entry.color }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [chartTimeframe, setChartTimeframe] = useState<string>("6M");

  const [stats, setStats] = useState<StatCard[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPerformanceData[]>([]);
  const [spendPlatform, setSpendPlatform] = useState<PlatformSpend[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [insights, setInsights] = useState<InsightsSummary | null>(null);

  const getOrgIdFromStorage = (): string => {
    try {
      const selectedOrg = localStorage.getItem("selectedOrganization");
      if (selectedOrg) {
        const orgData = JSON.parse(selectedOrg);
        return orgData.org_id || orgData.id || "";
      }
    } catch (error) {
      console.error("Error parsing selectedOrganization:", error);
    }
    return "";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const newOrgId = getOrgIdFromStorage();
      if (newOrgId !== selectedOrgId) {
        setSelectedOrgId(newOrgId);
      }
    };

    const initialOrgId = getOrgIdFromStorage();
    setSelectedOrgId(initialOrgId);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("organizationChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("organizationChanged", handleStorageChange);
    };
  }, [selectedOrgId]);

  // Refetch whenever the organization or the chart timeframe changes.
  useEffect(() => {
    if (selectedOrgId) {
      fetchAnalyticsData();
    } else {
      setLoading(false);
    }
  }, [selectedOrgId, chartTimeframe]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/main/analytics/?org_id=${selectedOrgId}&range=${chartTimeframe}`
      );
      if (response.data) {
        transformData(response.data);
      }
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data");
      resetData();
    } finally {
      setLoading(false);
    }
  };

  const buildStatCards = (top?: TopMetrics): StatCard[] => {
    const card = (
      label: string,
      metric: MetricValue | undefined,
      format: (v: number) => string,
      icon: React.ReactNode,
      iconBg: string,
      sparklineColor: string
    ): StatCard => {
      const change = metric?.change_percent ?? 0;
      return {
        label,
        value: format(metric?.value ?? 0),
        change: formatChange(change),
        positive: change >= 0,
        icon,
        iconBg,
        sparklineColor,
        sparkline: metric?.sparkline ?? [],
      };
    };

    return [
      card("Total Spend", top?.total_spend, (v) => `$${v.toLocaleString()}`, <DollarSign className="w-4 h-4 text-blue-600" />, "bg-blue-50", "#2563eb"),
      card("Impressions", top?.impressions, (v) => v.toLocaleString(), <Eye className="w-4 h-4 text-emerald-600" />, "bg-emerald-50", "#10b981"),
      card("Click Rate", top?.click_rate, (v) => `${v}%`, <MousePointer className="w-4 h-4 text-blue-500" />, "bg-blue-50", "#2563eb"),
      card("Conversions", top?.conversions, (v) => v.toLocaleString(), <Target className="w-4 h-4 text-purple-600" />, "bg-purple-50", "#a855f7"),
    ];
  };

  const resetData = () => {
    setStats(buildStatCards());
    setMonthlyData([]);
    setDeviceData([]);
    setInsights(null);
    setSpendPlatform([
      { name: "Meta", value: 0, color: PLATFORM_COLORS.META },
      { name: "Google", value: 0, color: PLATFORM_COLORS.GOOGLE },
      { name: "TikTok", value: 0, color: PLATFORM_COLORS.TIKTOK },
    ]);
  };

  const transformData = (data: AnalyticsData) => {
    if (!data.top_metrics) {
      resetData();
      return;
    }

    setStats(buildStatCards(data.top_metrics));

    setMonthlyData(
      Object.entries(data.monthly_performance || {}).map(([label, m]) => ({
        date: label,
        impressions: m.impressions || 0,
        clicks: m.clicks || 0,
        conversions: m.conversions || 0,
      }))
    );

    setSpendPlatform([
      { name: "Meta", value: data.spend_by_platform?.META || 0, color: PLATFORM_COLORS.META },
      { name: "Google", value: data.spend_by_platform?.GOOGLE || 0, color: PLATFORM_COLORS.GOOGLE },
      { name: "TikTok", value: data.spend_by_platform?.TIKTOK || 0, color: PLATFORM_COLORS.TIKTOK },
    ]);

    // Backend returns { mobile: { clicks, impressions }, ... } — turn it into chart rows.
    setDeviceData(
      Object.entries(data.device_performance || {}).map(([device, m]) => ({
        device: device.charAt(0).toUpperCase() + device.slice(1).toLowerCase(),
        impressions: m.impressions || 0,
        clicks: m.clicks || 0,
      }))
    );

    setInsights(data.insights_summary ?? null);
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const totalSpendSum = spendPlatform.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {selectedOrgId ? `Organization ID: ${selectedOrgId}` : "No organization selected"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* The stat cards always compare the current calendar month with the previous one */}
          <div className="border border-slate-200 bg-white text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>This month vs last month</span>
          </div>

          {/* Refresh Button */}
          <button
            disabled={loading}
            onClick={handleRefresh}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TOP STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(stats.length > 0 ? stats : buildStatCards()).map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${stat.iconBg} shrink-0`}>{stat.icon}</div>
              <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div
                className={`flex items-center gap-1 font-semibold text-[11px] ${
                  stat.positive ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                <span>{stat.positive ? "↑" : "↓"}</span>
                <span>{stat.change}</span>
                <span className="text-slate-400 font-normal ml-0.5">vs last month</span>
              </div>

              <CardSparklineWave color={stat.sparklineColor} data={stat.sparkline} />
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE SECTION: PERFORMANCE OVER TIME MULTI-LINE CHART */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Performance Over Time</h2>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
            {CHART_TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartTimeframe === tf
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: "#10b981" }}
                name="Clicks"
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Conversions"
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                name="Impressions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Row */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Clicks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Conversions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Impressions</span>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: 2 CHARTS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CHART CARD: SPEND BY PLATFORM */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Spend by Platform</h2>
            <div className="relative">
              <button className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span>All Platforms</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {totalSpendSum > 0 ? (
            <div className="py-6">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendPlatform}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {spendPlatform.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-around text-center pt-4">
                {spendPlatform.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900">${item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 my-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-blue-600">No spend data available</h3>
              <p className="text-[11px] text-slate-400 font-medium max-w-xs mt-1 leading-relaxed">
                Run campaigns to see performance breakdown by platform.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT CHART CARD: PERFORMANCE BY DEVICE */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Performance by Device</h2>
            <div className="relative">
              <button className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span>All Devices</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {deviceData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 my-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-blue-600">No device data available</h3>
              <p className="text-[11px] text-slate-400 font-medium max-w-xs mt-1 leading-relaxed">
                Device breakdown appears once your campaigns have delivered impressions.
              </p>
            </div>
          ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="device"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clicks" fill="#10b981" name="Clicks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impressions" fill="#2563eb" name="Impressions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Legend */}
          <div>
            <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-600 py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span>Clicks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                <span>Impressions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: 4 METRIC INSIGHT CARDS (last 6 months, best platform per metric) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            { title: "Top Performing Platform", item: insights?.top_performing_platform, icon: <TrendingUp className="w-4 h-4" />, tone: "bg-blue-50 text-blue-600" },
            { title: "Most Conversions", item: insights?.most_conversions_platform, icon: <TrendingUp className="w-4 h-4" />, tone: "bg-emerald-50 text-emerald-600" },
            { title: "Best Click Rate", item: insights?.best_click_rate_platform, icon: <Target className="w-4 h-4" />, tone: "bg-purple-50 text-purple-600" },
            { title: "Lowest Cost / Conversion", item: insights?.lowest_cost_per_conversion, icon: <DollarSign className="w-4 h-4" />, tone: "bg-amber-50 text-amber-600" },
          ] as const
        ).map(({ title, item, icon, tone }) => (
          <div
            key={title}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-3.5"
          >
            <div className={`p-2.5 rounded-full shrink-0 ${tone}`}>{icon}</div>
            <div>
              <div className="text-xs font-semibold text-slate-500">{title}</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {item ? item.label : "No data available"}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                {item ? item.value : "Run campaigns to see insights"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;