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
  device_performance?: any;
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
  sparklineColor: string;
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

// Sparkline SVG component for Stat Cards
const CardSparklineWave = ({ color = "#2563eb" }: { color?: string }) => {
  return (
    <div className="w-16 h-6 overflow-hidden relative">
      <svg className="w-full h-full" viewBox="0 0 60 20" preserveAspectRatio="none">
        <path
          d="M 0 15 Q 12 18 24 12 T 48 8 T 60 10"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
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

const DEFAULT_DEVICE_DATA: DeviceData[] = [
  { device: "Mobile", impressions: 125000, clicks: 4300 },
  { device: "Desktop", impressions: 92000, clicks: 3200 },
  { device: "Tablet", impressions: 38000, clicks: 1500 },
];

const DEFAULT_MONTHLY_DATA: MonthlyPerformanceData[] = [
  { date: "Nov", impressions: 0, clicks: 0, conversions: 0 },
  { date: "Dec", impressions: 0, clicks: 0, conversions: 0 },
  { date: "Jan", impressions: 0, clicks: 0, conversions: 0 },
  { date: "Feb", impressions: 0, clicks: 0, conversions: 0 },
  { date: "Mar", impressions: 0, clicks: 0, conversions: 0 },
  { date: "Apr", impressions: 0, clicks: 0, conversions: 0 },
];

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
  const [timeRange] = useState<string>("Last 6 Months");
  const [chartTimeframe, setChartTimeframe] = useState<string>("6M");

  const [stats, setStats] = useState<StatCard[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPerformanceData[]>(DEFAULT_MONTHLY_DATA);
  const [spendPlatform, setSpendPlatform] = useState<PlatformSpend[]>([]);
  const [deviceData] = useState<DeviceData[]>(DEFAULT_DEVICE_DATA);

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
    return "7445262637849382912";
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

  useEffect(() => {
    if (selectedOrgId) {
      fetchAnalyticsData();
    } else {
      setLoading(false);
    }
  }, [selectedOrgId]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/main/analytics/?org_id=${selectedOrgId}`);
      if (response.data) {
        transformData(response.data);
      }
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      // Populate clean default empty state format
      populateDefaults();
    } fontally: {
      setLoading(false);
    }
  };

  const populateDefaults = () => {
    setStats([
      {
        label: "Total Spend",
        value: "$0",
        change: "~ 0%",
        positive: true,
        icon: <DollarSign className="w-4 h-4 text-blue-600" />,
        iconBg: "bg-blue-50",
        sparklineColor: "#2563eb",
      },
      {
        label: "Impressions",
        value: "0",
        change: "~ 0%",
        positive: true,
        icon: <Eye className="w-4 h-4 text-emerald-600" />,
        iconBg: "bg-emerald-50",
        sparklineColor: "#10b981",
      },
      {
        label: "Click Rate",
        value: "0%",
        change: "~ 0%",
        positive: true,
        icon: <MousePointer className="w-4 h-4 text-blue-500" />,
        iconBg: "bg-blue-50",
        sparklineColor: "#2563eb",
      },
      {
        label: "Conversions",
        value: "0",
        change: "~ 0%",
        positive: true,
        icon: <Target className="w-4 h-4 text-purple-600" />,
        iconBg: "bg-purple-50",
        sparklineColor: "#a855f7",
      },
    ]);
    setMonthlyData(DEFAULT_MONTHLY_DATA);
    setSpendPlatform([
      { name: "Meta", value: 0, color: PLATFORM_COLORS.META },
      { name: "Google", value: 0, color: PLATFORM_COLORS.GOOGLE },
      { name: "TikTok", value: 0, color: PLATFORM_COLORS.TIKTOK },
    ]);
  };

  const transformData = (data: AnalyticsData) => {
    if (!data.top_metrics) {
      populateDefaults();
      return;
    }

    const transformedStats: StatCard[] = [
      {
        label: "Total Spend",
        value: `$${(data.top_metrics.total_spend?.value || 0).toLocaleString()}`,
        change: `~ ${data.top_metrics.total_spend?.change_percent || 0}%`,
        positive: (data.top_metrics.total_spend?.change_percent || 0) >= 0,
        icon: <DollarSign className="w-4 h-4 text-blue-600" />,
        iconBg: "bg-blue-50",
        sparklineColor: "#2563eb",
      },
      {
        label: "Impressions",
        value: (data.top_metrics.impressions?.value || 0).toLocaleString(),
        change: `~ ${data.top_metrics.impressions?.change_percent || 0}%`,
        positive: (data.top_metrics.impressions?.change_percent || 0) >= 0,
        icon: <Eye className="w-4 h-4 text-emerald-600" />,
        iconBg: "bg-emerald-50",
        sparklineColor: "#10b981",
      },
      {
        label: "Click Rate",
        value: `${data.top_metrics.click_rate?.value || 0}%`,
        change: `~ ${data.top_metrics.click_rate?.change_percent || 0}%`,
        positive: (data.top_metrics.click_rate?.change_percent || 0) >= 0,
        icon: <MousePointer className="w-4 h-4 text-blue-500" />,
        iconBg: "bg-blue-50",
        sparklineColor: "#2563eb",
      },
      {
        label: "Conversions",
        value: (data.top_metrics.conversions?.value || 0).toLocaleString(),
        change: `~ ${data.top_metrics.conversions?.change_percent || 0}%`,
        positive: (data.top_metrics.conversions?.change_percent || 0) >= 0,
        icon: <Target className="w-4 h-4 text-purple-600" />,
        iconBg: "bg-purple-50",
        sparklineColor: "#a855f7",
      },
    ];
    setStats(transformedStats);

    if (data.monthly_performance) {
      const months = Object.keys(data.monthly_performance);
      if (months.length > 0) {
        setMonthlyData(
          months.map((m) => ({
            date: m,
            impressions: data.monthly_performance[m].impressions || 0,
            clicks: data.monthly_performance[m].clicks || 0,
            conversions: data.monthly_performance[m].conversions || 0,
          }))
        );
      }
    }

    if (data.spend_by_platform) {
      setSpendPlatform([
        { name: "Meta", value: data.spend_by_platform.META || 0, color: PLATFORM_COLORS.META },
        { name: "Google", value: data.spend_by_platform.GOOGLE || 0, color: PLATFORM_COLORS.GOOGLE },
        { name: "TikTok", value: data.spend_by_platform.TIKTOK || 0, color: PLATFORM_COLORS.TIKTOK },
      ]);
    }
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
            Organization ID: {selectedOrgId || "7445262637849382912"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Selector Dropdown */}
          <div className="relative">
            <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>
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
        {(stats.length > 0 ? stats : DEFAULT_STATS).map((stat) => (
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
              <div className="flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                <span>~</span>
                <span>{stat.change}</span>
                <span className="text-slate-400 font-normal ml-0.5">vs previous 6 months</span>
              </div>

              <CardSparklineWave color={stat.sparklineColor} />
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
            {["7D", "30D", "3M", "6M", "1Y"].map((tf) => (
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

          {/* Legend & Note */}
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
            <p className="text-[10px] text-slate-400 text-center font-medium mt-2">
              * Sample data shown. Device performance tracking coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: 4 METRIC INSIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Top Performing Platform */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Top Performing Platform</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">No data available</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Run campaigns to see insights</div>
          </div>
        </div>

        {/* Card 2: Most Conversions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Most Conversions</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">No data available</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Run campaigns to see insights</div>
          </div>
        </div>

        {/* Card 3: Best Click Rate */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-full bg-purple-50 text-purple-600 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Best Click Rate</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">No data available</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Run campaigns to see insights</div>
          </div>
        </div>

        {/* Card 4: Lowest Cost / Conversion */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Lowest Cost / Conversion</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">No data available</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Run campaigns to see insights</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_STATS: StatCard[] = [
  {
    label: "Total Spend",
    value: "$0",
    change: "~ 0%",
    positive: true,
    icon: <DollarSign className="w-4 h-4 text-blue-600" />,
    iconBg: "bg-blue-50",
    sparklineColor: "#2563eb",
  },
  {
    label: "Impressions",
    value: "0",
    change: "~ 0%",
    positive: true,
    icon: <Eye className="w-4 h-4 text-emerald-600" />,
    iconBg: "bg-emerald-50",
    sparklineColor: "#10b981",
  },
  {
    label: "Click Rate",
    value: "0%",
    change: "~ 0%",
    positive: true,
    icon: <MousePointer className="w-4 h-4 text-blue-500" />,
    iconBg: "bg-blue-50",
    sparklineColor: "#2563eb",
  },
  {
    label: "Conversions",
    value: "0",
    change: "~ 0%",
    positive: true,
    icon: <Target className="w-4 h-4 text-purple-600" />,
    iconBg: "bg-purple-50",
    sparklineColor: "#a855f7",
  },
];

export default Analytics;