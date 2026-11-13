import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Target,
  BarChart2,
  MoreVertical,
  Trash2,
  Check,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import api from "@/lib/axios";

// Platform Icon Components
export const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <img
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_10_m3mnnq.png"
    alt="Facebook"
    className={`${className} object-contain`}
  />
);

export const GoogleAdsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <img
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_11_bdja1x.png"
    alt="Google Ads"
    className={`${className} object-contain`}
  />
);

export const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <img
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_12_siwhfp.png"
    alt="TikTok"
    className={`${className} object-contain`}
  />
);

export const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-gradient-icon-fixed" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-gradient-icon-fixed)" />
    <rect x="5" y="5" width="14" height="14" rx="4" stroke="white" strokeWidth="1.8" fill="none" />
    <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.8" fill="none" />
    <circle cx="15.8" cy="8.2" r="0.9" fill="white" />
  </svg>
);

// Dynamic Sparkline SVG path generator
const generateSparklinePath = (points?: number[]): string => {
  if (!points || points.length === 0) {
    return "M 0 15 Q 25 18 50 15 T 100 15";
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 100;
  const height = 24;
  const padding = 3;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - padding - ((p - min) / range) * (height - 2 * padding);
    return [x, y];
  });

  if (coords.length === 1) {
    return `M 0 ${coords[0][1]} L 100 ${coords[0][1]}`;
  }

  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const mx = ((x0 + x1) / 2).toFixed(1);
    const my = ((y0 + y1) / 2).toFixed(1);
    d += ` Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${mx} ${my}`;
  }
  const last = coords[coords.length - 1];
  d += ` T ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
};

// Sparkline SVG renderer
const Sparkline = ({
  stroke,
  gradId,
  points,
}: {
  stroke: string;
  gradId: string;
  points?: number[];
}) => {
  const pathD = generateSparklinePath(points);
  return (
    <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      <path d={`${pathD} L 100 30 L 0 30 Z`} fill={`url(#${gradId})`} />
    </svg>
  );
};

// Dynamic Chart Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px] z-50">
        <div className="text-slate-400 font-medium mb-1.5">{label}</div>
        {payload.map((item: any, idx: number) => {
          const dotColor = item.color || "#2563eb";
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }}></span>
                {item.name}
              </span>
              <span className="font-semibold text-slate-900">
                {typeof item.value === "number"
                  ? item.value >= 1000
                    ? `${(item.value / 1000).toFixed(0)}K`
                    : item.value
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Types for backend response
export interface PlatformCardData {
  name: string;
  platform: string;
  spend: number;
  formatted_spend: string;
  delta: string;
  change_percent: number | null;
  is_positive: boolean | null;
  sub_label: string;
  color: string;
  sparkline: number[];
}

export interface OverviewMetricData {
  id: string;
  label: string;
  value: string;
  raw_value: number;
  delta: string;
  change_percent: number | null;
  is_positive: boolean | null;
}

export interface ChartDataPoint {
  date: string;
  Facebook?: number;
  GoogleAds?: number;
  TikTok?: number;
  Instagram?: number;
  [key: string]: any;
}

export interface TopCampaignData {
  id: number;
  name: string;
  platform: string;
  platforms: string[];
  spend: string;
  raw_spend: number;
  conversions: string;
  raw_conversions: number;
  roas: string;
  raw_roas: number;
  ctr: string;
  raw_ctr: number;
  status: string;
}

export interface AIInsightData {
  id: number;
  title: string;
  description: string;
  impact: string;
  impact_badge: string;
  confidence: number;
  confidence_text: string;
  roi_impact: string;
  icon_type: string;
  created_at: string;
}

export interface BudgetRecommendationData {
  campaign_id: number;
  campaign_name: string;
  action_text: string;
  description: string;
  badge_percent: string;
  badge_label: string;
  potential_impact: string;
  progress_percent: number;
  recommended_budget_increase: number;
  can_apply?: boolean;
}

export interface DateRangeData {
  selected: string;
  label: string;
  comparison_label: string;
  start_date: string;
  end_date: string;
}

export interface DashboardResponse {
  date_range?: DateRangeData;
  platform_cards?: PlatformCardData[];
  overview_metrics?: OverviewMetricData[];
  chart_data?: ChartDataPoint[];
  top_campaigns?: TopCampaignData[];
  ai_insights?: AIInsightData[];
  budget_recommendation?: BudgetRecommendationData;
  total_spend?: number;
  impressions?: number;
  click_rate?: number;
  roas?: number;
  has_data?: boolean;
  has_period_data?: boolean;
  last_synced_at?: string | null;
  currency?: string;
  mixed_currencies?: boolean;
  partial_platforms?: { platform: string; reason: string }[];
}

// Delete Confirmation Modal
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignName: string;
  loading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <Trash2 className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Delete Campaign</h3>
        </div>

        <p className="text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold">"{campaignName}"</span>? This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const TIME_RANGE_OPTIONS = [
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all_time", label: "All Time" },
];

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [_loading, setLoading] = useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>("last_30_days");
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState<boolean>(false);
  const [applyingBudget, setApplyingBudget] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    campaignId: number | null;
    campaignName: string;
  }>({
    isOpen: false,
    campaignId: null,
    campaignName: "",
  });

  const getOrgId = (): string => {
    try {
      const selectedOrg = localStorage.getItem("selectedOrganization");
      if (selectedOrg) {
        const orgData = JSON.parse(selectedOrg);
        if (orgData && orgData.id) return orgData.id;
      }
      const orgs = localStorage.getItem("organizations");
      if (orgs) {
        const orgsData = JSON.parse(orgs);
        if (Array.isArray(orgsData) && orgsData.length > 0 && orgsData[0][0]) {
          return orgsData[0][0];
        }
      }
    } catch (error) {
      console.error("Error parsing organization data:", error);
    }
    return "";
  };

  const orgId = getOrgId();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTimeRangeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDashboardData = async (selectedRange = timeRange) => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/main/dashboard/?org_id=${orgId}&time_range=${selectedRange}`);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchDashboardData(timeRange);
    } else {
      setLoading(false);
    }
  }, [orgId, timeRange]);

  const handleTimeRangeSelect = (rangeValue: string) => {
    setTimeRange(rangeValue);
    setShowTimeRangeDropdown(false);
  };

  const handleDeleteClick = (campaignId: number, campaignName: string) => {
    setDeleteModal({
      isOpen: true,
      campaignId,
      campaignName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.campaignId || !orgId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/main/campaign/${deleteModal.campaignId}/?org_id=${orgId}`);
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          top_campaigns: (prev.top_campaigns || []).filter(
            (c) => c.id !== deleteModal.campaignId
          ),
        };
      });
      setDeleteModal({ isOpen: false, campaignId: null, campaignName: "" });
      toast.success("Campaign deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApplyRecommendation = async () => {
    const rec = dashboardData?.budget_recommendation;
    if (!orgId) return;
    setApplyingBudget(true);
    try {
      const res = await api.post(`/main/apply-budget-recommendation/?org_id=${orgId}`, {
        campaign_id: rec?.campaign_id,
        increase_amount: rec?.recommended_budget_increase || 50.0,
      });
      toast.success(res.data?.message || "Budget recommendation applied successfully!");
      fetchDashboardData(timeRange);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to apply recommendation");
    } finally {
      setApplyingBudget(false);
    }
  };

  const getPlatformIcon = (platformKey: string, className = "w-5 h-5") => {
    const p = platformKey?.toLowerCase() || "";
    if (p.includes("facebook") || p === "meta") return <FacebookIcon className={className} />;
    if (p.includes("google")) return <GoogleAdsIcon className={className} />;
    if (p.includes("tiktok")) return <TikTokIcon className={className} />;
    if (p.includes("instagram")) return <InstagramIcon className={className} />;
    return (
      <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
        <BarChart2 className="w-4 h-4" />
      </div>
    );
  };

  const platformCards = dashboardData?.platform_cards || [];
  const overviewMetrics = dashboardData?.overview_metrics || [];
  const chartData = dashboardData?.chart_data || [];
  const campaignsList = dashboardData?.top_campaigns || [];
  const aiInsights = dashboardData?.ai_insights || [];
  const budgetRec = dashboardData?.budget_recommendation;
  const dateRangeLabel = dashboardData?.date_range?.label || "Select date range";
  const hasData = dashboardData?.has_data !== false;
  const hasPeriodData = dashboardData?.has_period_data !== false;
  const lastSynced = dashboardData?.last_synced_at
    ? new Date(dashboardData.last_synced_at).toLocaleString()
    : null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, campaignId: null, campaignName: "" })}
        onConfirm={handleDeleteConfirm}
        campaignName={deleteModal.campaignName}
        loading={deleteLoading}
      />

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Dashboard <span>👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back! Here's your campaign overview and performance summary.
            {lastSynced && <span className="ml-2 text-slate-400">Last updated {lastSynced}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {/* Dynamic Date Picker Selector */}
          <button
            onClick={() => setShowTimeRangeDropdown((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateRangeLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showTimeRangeDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTimeRangeSelect(opt.value)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    timeRange === opt.value
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {timeRange === opt.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasData && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-800">
          No analytics yet. Connect an ad account or run a sync to see real spend,
          conversions and AI recommendations here.
        </div>
      )}

      {hasData && !hasPeriodData && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          No activity in this date range. Try a wider range or run a sync.
        </div>
      )}

      {dashboardData?.mixed_currencies && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-800">
          This organization reports in multiple currencies. Totals and cards are shown in{" "}
          {dashboardData?.currency || "the primary currency"} only; switch to an
          integration that reports in another currency to see it.
        </div>
      )}

      {/* TOP PLATFORM SPEND CARDS GRID (DYNAMIC FROM BACKEND) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {platformCards.map((card, idx) => (
          <div
            key={card.platform || idx}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(card.platform)}
                  <span className="text-xs font-semibold text-slate-700">{card.name}</span>
                </div>
                <span
                  className={`font-semibold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    card.change_percent == null
                      ? "bg-slate-50 text-slate-500"
                      : card.is_positive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {card.delta}
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {card.formatted_spend}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                <span>Spend</span>
                <span>{card.sub_label}</span>
              </div>
            </div>
            <div className="mt-3 -mb-2 -mx-4">
              <Sparkline
                stroke={card.color || "#2563eb"}
                gradId={`dash-spark-${card.platform || idx}`}
                points={card.sparkline}
              />
            </div>
          </div>
        ))}
      </div>

      {/* MAIN DASHBOARD CONTENT (2 COLUMNS: LEFT ~67%, RIGHT ~33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (PERFORMANCE OVERVIEW + TOP CAMPAIGNS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* PERFORMANCE OVERVIEW CARD */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Performance Overview</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span>{dashboardData?.date_range?.comparison_label || "vs. Comparison Period"}</span>
              </div>
            </div>

            {/* Dynamic Metric Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {overviewMetrics.map((m, idx) => (
                <div key={m.id || idx} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3">
                  <div className="text-xs text-slate-500 font-medium">{m.label}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{m.value}</div>
                  <div
                    className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${
                      m.change_percent == null
                        ? "text-slate-400"
                        : m.is_positive
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {m.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Interactive Multi-Line Chart (Dynamic from Backend) */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    tickFormatter={(v) => (v === 0 ? "0" : `${v}K`)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Facebook"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="GoogleAds"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="TikTok"
                    stroke="#1e293b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#1e293b", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Instagram"
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#ec4899", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Facebook</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Google Ads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                <span>TikTok</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                <span>Instagram</span>
              </div>
            </div>
          </div>

          {/* TOP CAMPAIGNS TABLE CARD (DYNAMIC FROM BACKEND) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Top Campaigns</h2>
              <Link
                to="/user-dashboard/campaigns"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all campaigns &gt;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 font-medium border-b border-slate-100 text-left">
                    <th className="pb-3 font-medium">Campaign</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Spend</th>
                    <th className="pb-3 font-medium">Conversions</th>
                    <th className="pb-3 font-medium">ROAS</th>
                    <th className="pb-3 font-medium">CTR</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaignsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No campaigns found.{" "}
                        <Link
                          to="/user-dashboard/campaigns-create/step-1"
                          className="text-blue-600 underline font-medium"
                        >
                          Create your first campaign
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    campaignsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-semibold text-slate-800">
                          <Link
                            to={`/user-dashboard/campaigns-view-details/${c.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            {getPlatformIcon(c.platform)}
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-700 font-medium">{c.spend}</td>
                        <td className="py-3.5 text-slate-700 font-medium">{c.conversions}</td>
                        <td className="py-3.5 text-slate-700 font-medium">{c.roas}</td>
                        <td className="py-3.5 text-slate-700 font-medium">{c.ctr}</td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            <button
                              onClick={() => navigate(`/user-dashboard/campaigns-view-details/${c.id}`)}
                              className="p-1 hover:text-blue-600 transition-colors cursor-pointer"
                              title="View Campaign Details"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(c.id, c.name)}
                              className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Campaign"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (AI INSIGHTS + BUDGET RECOMMENDATION) */}
        <div className="lg:col-span-1 space-y-6">
          {/* ✨ AI INSIGHTS CARD (DYNAMIC FROM BACKEND) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Insights</span>
              </h2>
              <Link
                to="/user-dashboard/ai-tools"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all &gt;
              </Link>
            </div>

            {/* Recommendation Cards */}
            <div className="space-y-3.5">
              {aiInsights.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
                  {hasData
                    ? "No open recommendations right now."
                    : "Insights appear after your first analytics sync."}
                </p>
              )}
              {aiInsights.map((ins, idx) => {
                const isHigh = ins.impact === "HIGH";
                const isMedium = ins.impact === "MEDIUM";

                const iconBg = isHigh
                  ? "bg-emerald-100/70 text-emerald-600"
                  : isMedium
                  ? "bg-sky-100/70 text-sky-600"
                  : "bg-purple-100/70 text-purple-600";

                const badgeBg = isHigh
                  ? "bg-emerald-50 text-emerald-600"
                  : isMedium
                  ? "bg-sky-50 text-sky-600"
                  : "bg-purple-50 text-purple-600";

                const roiColor = isHigh
                  ? "text-emerald-600"
                  : isMedium
                  ? "text-sky-600"
                  : "text-purple-600";

                return (
                  <div
                    key={ins.id || idx}
                    className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconBg}`}>
                        {ins.icon_type === "trend" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : ins.icon_type === "target" ? (
                          <Target className="w-4 h-4" />
                        ) : (
                          <BarChart2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{ins.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {ins.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${badgeBg}`}>
                          {ins.impact_badge}
                        </span>
                        {ins.confidence_text && (
                          <span className="text-slate-400">{ins.confidence_text}</span>
                        )}
                      </div>
                      {ins.roi_impact && (
                        <span className={`font-bold ${roiColor}`}>{ins.roi_impact}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All AI Insights Button */}
            <button
              onClick={() => navigate("/user-dashboard/ai-tools")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>View All AI Insights</span>
            </button>
          </div>

          {/* ✨ BUDGET RECOMMENDATION CARD (DYNAMIC FROM BACKEND) */}
          {budgetRec && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Budget Recommendation</span>
              </h2>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-600">{budgetRec.action_text}</div>
                  <div className="text-sm font-bold text-blue-600">{budgetRec.campaign_name}</div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    {budgetRec.description}
                  </p>
                </div>

                {/* Donut gauge graphic */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600"
                      strokeDasharray={`${budgetRec.progress_percent || 32}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-extrabold text-slate-900 leading-none">
                      {budgetRec.badge_percent}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                      {budgetRec.badge_label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Apply Recommendation Button */}
              <button
                onClick={handleApplyRecommendation}
                disabled={applyingBudget || budgetRec.can_apply === false}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {budgetRec.can_apply === false ? (
                  <span>Add a campaign budget first</span>
                ) : applyingBudget ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <span>Apply Recommendation</span>
                )}
              </button>

              {/* Potential Impact Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Potential Impact</span>
                  <span className="font-bold text-emerald-600">{budgetRec.potential_impact}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${budgetRec.progress_percent || 75}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
