import React, { useState, useEffect } from "react";
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

// Sparkline SVG renderer
const Sparkline = ({
  stroke,
  gradId,
  pathD,
}: {
  stroke: string;
  gradId: string;
  pathD: string;
}) => (
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

// Custom Chart Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px] z-50">
        <div className="text-slate-400 font-medium mb-1.5">{label}, 2024</div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Facebook
          </span>
          <span className="font-semibold text-slate-900">162K</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Google Ads
          </span>
          <span className="font-semibold text-slate-900">112K</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span> TikTok
          </span>
          <span className="font-semibold text-slate-900">68K</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span> Instagram
          </span>
          <span className="font-semibold text-slate-900">48K</span>
        </div>
      </div>
    );
  }
  return null;
};

// Types for backend response
interface DashboardData {
  total_spend?: number;
  impressions?: number;
  click_rate?: number;
  roas?: number;
  spend_overview?: Record<string, any>;
  ai_insights?: Array<any>;
  recent_campaigns?: Array<any>;
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

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [_loading, setLoading] = useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

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

  useEffect(() => {
    if (orgId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [orgId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/main/dashboard/?org_id=${orgId}`);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
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
          recent_campaigns: (prev.recent_campaigns || []).filter(
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

  // Top platform spend cards data
  const platformCards = [
    {
      name: "Facebook",
      icon: <FacebookIcon className="w-5 h-5" />,
      spend: "$4,230.55",
      delta: "↑ 12.5%",
      subLabel: "vs Apr 1 - Apr 30",
      stroke: "#2563eb",
      gradId: "fb-spark-dash",
      pathD: "M 0 18 Q 15 22 25 15 T 50 18 T 75 10 T 100 12",
    },
    {
      name: "Google Ads",
      icon: <GoogleAdsIcon className="w-5 h-5" />,
      spend: "$3,215.45",
      delta: "↑ 8.3%",
      subLabel: "vs Apr 1 - Apr 30",
      stroke: "#10b981",
      gradId: "goog-spark-dash",
      pathD: "M 0 20 Q 20 25 35 18 T 65 14 T 85 10 T 100 12",
    },
    {
      name: "TikTok",
      icon: <TikTokIcon className="w-5 h-5" />,
      spend: "$2,815.20",
      delta: "↑ 15.7%",
      subLabel: "vs Apr 1 - Apr 30",
      stroke: "#1e293b",
      gradId: "tt-spark-dash",
      pathD: "M 0 22 Q 15 15 30 18 T 60 12 T 80 16 T 100 8",
    },
    {
      name: "Instagram",
      icon: <InstagramIcon className="w-5 h-5" />,
      spend: "$1,245.30",
      delta: "↑ 5.3%",
      subLabel: "vs Apr 1 - Apr 30",
      stroke: "#ec4899",
      gradId: "ig-spark-dash",
      pathD: "M 0 20 Q 25 25 40 18 T 70 20 T 90 12 T 100 14",
    },
    {
      name: "Total Spend",
      icon: (
        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
          <BarChart2 className="w-4 h-4" />
        </div>
      ),
      spend: dashboardData?.total_spend
        ? `$${dashboardData.total_spend.toLocaleString()}`
        : "$11,506.50",
      delta: "↑ 11.2%",
      subLabel: "vs Apr 1 - Apr 30",
      stroke: "#2563eb",
      gradId: "tot-spark-dash",
      pathD: "M 0 19 Q 20 22 40 16 T 70 18 T 90 10 T 100 14",
    },
  ];

  // Performance Overview Metrics
  const overviewMetrics = [
    {
      label: "Impressions",
      value: dashboardData?.impressions ? `${(dashboardData.impressions / 1000000).toFixed(2)}M` : "2.45M",
      delta: "▲ 18.6%",
    },
    { label: "Clicks", value: "145K", delta: "▲ 16.3%" },
    { label: "Conversions", value: "3,242", delta: "▲ 23.1%" },
    { label: "Cost / Conv.", value: "$3.55", delta: "▲ 9.6%" },
    {
      label: "ROAS",
      value: dashboardData?.roas ? `${dashboardData.roas.toFixed(2)}x` : "4.35x",
      delta: "▲ 19.8%",
    },
  ];

  // Line Chart Data
  const chartData = [
    { date: "May 1", Facebook: 155, GoogleAds: 110, TikTok: 70, Instagram: 35 },
    { date: "May 6", Facebook: 125, GoogleAds: 92, TikTok: 58, Instagram: 28 },
    { date: "May 11", Facebook: 142, GoogleAds: 105, TikTok: 68, Instagram: 38 },
    { date: "May 16", Facebook: 162, GoogleAds: 112, TikTok: 68, Instagram: 48 },
    { date: "May 21", Facebook: 128, GoogleAds: 96, TikTok: 62, Instagram: 30 },
    { date: "May 26", Facebook: 156, GoogleAds: 110, TikTok: 64, Instagram: 38 },
    { date: "May 31", Facebook: 149, GoogleAds: 104, TikTok: 66, Instagram: 32 },
  ];

  // Top Campaigns Data
  const campaignsList = [
    {
      id: 1,
      name: "Summer Sale 2024",
      platform: "Facebook",
      icon: <FacebookIcon className="w-5 h-5" />,
      spend: "$1,250.45",
      conversions: "452",
      roas: "4.62x",
      ctr: "2.35%",
    },
    {
      id: 2,
      name: "Search | Brand Campaign",
      platform: "Google Ads",
      icon: <GoogleAdsIcon className="w-5 h-5" />,
      spend: "$980.30",
      conversions: "320",
      roas: "5.11x",
      ctr: "3.02%",
    },
    {
      id: 3,
      name: "TikTok | New Collection",
      platform: "TikTok",
      icon: <TikTokIcon className="w-5 h-5" />,
      spend: "$875.20",
      conversions: "210",
      roas: "3.85x",
      ctr: "2.15%",
    },
    {
      id: 4,
      name: "Instagram | Spring Promo",
      platform: "Instagram",
      icon: <InstagramIcon className="w-5 h-5" />,
      spend: "$645.10",
      conversions: "128",
      roas: "2.98x",
      ctr: "1.85%",
    },
    {
      id: 5,
      name: "Remarketing Campaign",
      platform: "Facebook",
      icon: <FacebookIcon className="w-5 h-5" />,
      spend: "$420.25",
      conversions: "98",
      roas: "2.45x",
      ctr: "1.45%",
    },
  ];

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
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker Selector */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>May 1 – May 31, 2024</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* TOP PLATFORM SPEND CARDS GRID (5 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {platformCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {card.icon}
                  <span className="text-xs font-semibold text-slate-700">{card.name}</span>
                </div>
                <span className="bg-emerald-50 text-emerald-600 font-semibold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  {card.delta}
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">{card.spend}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                <span>Spend</span>
                <span>{card.subLabel}</span>
              </div>
            </div>
            <div className="mt-3 -mb-2 -mx-4">
              <Sparkline stroke={card.stroke} gradId={card.gradId} pathD={card.pathD} />
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
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors">
                <span>vs. Apr 1 – Apr 30, 2024</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* 5 Metric Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {overviewMetrics.map((m, idx) => (
                <div key={idx} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3">
                  <div className="text-xs text-slate-500 font-medium">{m.label}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{m.value}</div>
                  <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                    {m.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Interactive Multi-Line Chart */}
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

          {/* TOP CAMPAIGNS TABLE CARD */}
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
                  {campaignsList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">{c.icon}</div>
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">{c.spend}</td>
                      <td className="py-3.5 text-slate-700 font-medium">{c.conversions}</td>
                      <td className="py-3.5 text-slate-700 font-medium">{c.roas}</td>
                      <td className="py-3.5 text-slate-700 font-medium">{c.ctr}</td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400">
                          <button className="p-1 hover:text-blue-600 transition-colors">
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(c.id, c.name)}
                            className="p-1 hover:text-red-600 transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (AI INSIGHTS + BUDGET RECOMMENDATION) */}
        <div className="lg:col-span-1 space-y-6">
          {/* ✨ AI INSIGHTS CARD */}
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
              {/* Insight 1 */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-600 shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Increase Budget on Google Ads</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Your Google Ads campaigns are performing 23% better than average. Consider increasing budget.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                      High Impact
                    </span>
                    <span className="text-slate-400">Confidence: 92%</span>
                  </div>
                  <span className="font-bold text-emerald-600">+18% ROI</span>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-100/70 text-sky-600 shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Improve ROAS on TikTok</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Some TikTok ad sets have ROAS below 2.0x. Optimize creatives and targeting.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-50 text-sky-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                      Medium Impact
                    </span>
                    <span className="text-slate-400">Confidence: 78%</span>
                  </div>
                  <span className="font-bold text-sky-600">+12% ROI</span>
                </div>
              </div>

              {/* Insight 3 */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100/70 text-purple-600 shrink-0 mt-0.5">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Best Time to Advertise</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Your ads perform best between 10AM - 2PM. Consider increasing bids during this time.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                      Tip
                    </span>
                    <span className="text-slate-400">Confidence: 85%</span>
                  </div>
                  <span className="font-bold text-purple-600">+8% ROI</span>
                </div>
              </div>
            </div>

            {/* View All AI Insights Button */}
            <button
              onClick={() => navigate("/user-dashboard/ai-tools")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>View All AI Insights</span>
            </button>
          </div>

          {/* ✨ BUDGET RECOMMENDATION CARD */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Budget Recommendation</span>
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-600">Increase budget on</div>
                <div className="text-sm font-bold text-blue-600">Summer Sale 2024</div>
                <p className="text-[11px] text-slate-500 leading-snug mt-1">
                  This campaign is performing 32% better than similar campaigns.
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
                    strokeDasharray="32, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-extrabold text-slate-900 leading-none">32%</span>
                  <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Better</span>
                </div>
              </div>
            </div>

            {/* Apply Recommendation Button */}
            <button
              onClick={() => toast.success("Budget recommendation applied!")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md"
            >
              Apply Recommendation
            </button>

            {/* Potential Impact Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Potential Impact</span>
                <span className="font-bold text-emerald-600">+$1,250</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-3/4 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
