import React, { useState, useEffect, useRef } from "react";
import { formatToLocalDate } from "@/lib/dateUtils";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Filter,
  Play,
  Pause,
} from "lucide-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Campaign {
  id: number;
  name: string;
  objective: string;
  status: string;
  platforms: string[];
  total_budget: number;
  total_spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  roas: number;
  currency: string;
  created_at: string;
  updated_at: string;
  draft_data: any;
  organization: number;
  // Period-over-period trends (last 7 days vs the 7 before). null when there is no data yet.
  ctr_trend?: string | null;
  conversions_trend?: string | null;
  roas_trend?: string | null;
  // Daily clicks for the last 7 days
  sparkline_data?: number[];
}

// Brand SVG Icons
const MetaIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-3.5 h-3.5 fill-slate-900 shrink-0" viewBox="0 0 24 24">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.378A6.347 6.347 0 0 0 4 15.666a6.34 6.34 0 0 0 6.335 6.334c3.44 0 6.27-2.73 6.342-6.14V8.583a8.16 8.16 0 0 0 4.757 1.547V6.698a4.814 4.814 0 0 1-1.845-.012z"/>
  </svg>
);

// Builds a smooth SVG path from the daily series (viewBox is 100 x 24).
const buildSparklinePath = (data: number[]): string => {
  const width = 100;
  const top = 3;
  const bottom = 21;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((value, i) => ({
    x: data.length === 1 ? width / 2 : (i / (data.length - 1)) * width,
    y: bottom - ((value - min) / range) * (bottom - top),
  }));
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = points[i - 1];
      const midX = ((prev.x + p.x) / 2).toFixed(1);
      return `C ${midX} ${prev.y.toFixed(1)} ${midX} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ");
};

const CardSparkline = ({ status, id, data }: { status: string; id: number; data?: number[] }) => {
  const isDraft = status?.toUpperCase() === "DRAFT";
  const isPaused = status?.toUpperCase() === "PAUSED";
  const series = data && data.length > 1 ? data : [];
  const hasActivity = series.some((v) => v > 0);

  const strokeColor = isDraft || !hasActivity ? "#cbd5e1" : isPaused ? "#f59e0b" : "#10b981";
  const pathD = buildSparklinePath(hasActivity ? series : [0, 0]);

  return (
    <div className="w-full h-7 overflow-hidden relative my-1.5" title="Clicks, last 7 days">
      <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L 100 24 L 0 24 Z`} fill={`url(#spark-grad-${id})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
      </svg>
    </div>
  );
};

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, paused: 0, draft: 0 });
  const [syncing, setSyncing] = useState(false);
  const PAGE_SIZE = 12;

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
      fetchCampaigns(currentPage, searchTerm, activeFilter);
    } else {
      setLoading(false);
      setError("No organization selected");
    }
  }, [orgId, currentPage, searchTerm, activeFilter]);

  useEffect(() => {
    if (orgId) fetchStatusCounts();
  }, [orgId]);

  const fetchStatusCounts = async () => {
    try {
      const [allRes, activeRes, pausedRes, draftRes] = await Promise.all([
        api.get(`/main/campaigns/?org_id=${orgId}&page_size=1`),
        api.get(`/main/campaigns/?org_id=${orgId}&status=ACTIVE&page_size=1`),
        api.get(`/main/campaigns/?org_id=${orgId}&status=PAUSED&page_size=1`),
        api.get(`/main/campaigns/?org_id=${orgId}&status=DRAFT&page_size=1`),
      ]);
      setStatusCounts({
        all: allRes.data.count || 0,
        active: activeRes.data.count || 0,
        paused: pausedRes.data.count || 0,
        draft: draftRes.data.count || 0,
      });
    } catch {
      // counts fail silently
    }
  };

  const fetchCampaigns = async (page: number = 1, search: string = "", statusFilter: string = "all") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ org_id: orgId, page: String(page), page_size: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter.toUpperCase());
      const response = await api.get(`/main/campaigns/?${params.toString()}`);
      const results = response.data.results || [];
      setCampaigns(results);
      setTotalCount(response.data.count || 0);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching campaigns:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load campaigns.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete campaign "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/main/campaign/${id}/?org_id=${orgId}`);
        const remaining = campaigns.filter((c) => c.id !== id).length;
        const newPage = remaining === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        if (newPage === currentPage) fetchCampaigns(currentPage, searchTerm, activeFilter);
        fetchStatusCounts();
        toast.success(`Campaign "${name}" deleted successfully.`);
      } catch (err: any) {
        console.error("Error deleting campaign:", err);
        toast.error("Failed to delete campaign.");
      }
    }
  };

  const handleDuplicate = async (_campaign: Campaign) => {
    toast.info("Duplicate functionality coming soon!");
  };

  const getStatusCount = (status: string) => {
    return statusCounts[status as keyof typeof statusCounts] ?? 0;
  };

  const formatCurrency = (value: number, currency: string = "USD"): string => {
    if (!value || isNaN(value)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    if (!value || isNaN(value)) return "0";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toString();
  };

  const formatPercentage = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0.00%";
    return value.toFixed(2) + "%";
  };

  const getBudgetDisplay = (campaign: Campaign): string => {
    if (campaign.draft_data?.budgets && campaign.draft_data.budgets.length > 0) {
      const totalBudget = campaign.draft_data.budgets.reduce(
        (sum: number, b: any) => sum + (b.budget || 0),
        0
      );
      if (totalBudget > 0) {
        return `${formatCurrency(totalBudget, campaign.currency)}/day`;
      }
    }
    if (campaign.total_budget) {
      return formatCurrency(campaign.total_budget, campaign.currency);
    }
    return "$0";
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto my-10">
        <div className="text-center bg-red-50 border border-red-200 p-6 rounded-2xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            onClick={() => fetchCampaigns(currentPage)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-2 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage and monitor all your ad campaigns in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={syncing}
            onClick={async () => {
              if (!orgId) {
                toast.error("Please select an organization first.");
                return;
              }
              setSyncing(true);
              try {
                await api.post(`/main/sync-ads/?org_id=${orgId}`);
                toast.success("Ads syncing initiated successfully!");
                fetchCampaigns(currentPage, searchTerm, activeFilter);
              } catch (err: any) {
                toast.error(err.response?.data?.error || "Failed to sync ads.");
              } finally {
                setSyncing(false);
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? "animate-spin" : ""}`} />
            <span>Sync your Ad</span>
          </button>

          <Link
            to="/user-dashboard/campaigns-create/step-1"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { key: "all", label: "All", count: getStatusCount("all") },
            { key: "active", label: "Active", count: getStatusCount("active") },
            { key: "paused", label: "Paused", count: getStatusCount("paused") },
            { key: "draft", label: "Draft", count: getStatusCount("draft") },
          ].map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Filters Action */}
        <button className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filters</span>
        </button>
      </div>

      {/* CAMPAIGN CARDS GRID */}
      {campaigns.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((item) => (
              <CampaignCard
                key={item.id}
                campaign={item}
                orgId={orgId}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onStatusToggle={(id, newStatus) => {
                  setCampaigns((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
                  );
                }}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatPercentage={formatPercentage}
                getBudgetDisplay={getBudgetDisplay}
              />
            ))}
          </div>

          {/* PAGINATION */}
          {totalCount > PAGE_SIZE && (() => {
            const totalPages = Math.ceil(totalCount / PAGE_SIZE);
            const startItem = (currentPage - 1) * PAGE_SIZE + 1;
            const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

            return (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4 pt-2">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{startItem}</span>–
                  <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalCount}</span> campaigns
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>

                  <span className="text-xs font-semibold text-slate-600 px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center max-w-md mx-auto my-12 border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Campaigns Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            You haven't created any campaigns matching this criteria yet.
          </p>
          <Link
            to="/user-dashboard/campaigns-create/step-1"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Campaign
          </Link>
        </div>
      )}
    </div>
  );
};

interface CampaignCardProps {
  campaign: Campaign;
  orgId: string;
  onDelete: (id: number, name: string) => void;
  onDuplicate: (campaign: Campaign) => void;
  onStatusToggle: (id: number, newStatus: string) => void;
  formatCurrency: (value: number, currency?: string) => string;
  formatNumber: (value: number) => string;
  formatPercentage: (value: number) => string;
  getBudgetDisplay: (campaign: Campaign) => string;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  orgId,
  onDelete,
  onDuplicate,
  onStatusToggle,
  formatCurrency,
  formatNumber,
  formatPercentage,
  getBudgetDisplay,
}) => {
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(campaign.status?.toUpperCase());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggleStatus = async () => {
    if (toggling) return;
    const prevStatus = optimisticStatus;
    const nextStatus = prevStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setOptimisticStatus(nextStatus);
    setToggling(true);
    try {
      const res = await api.post(`/main/campaign/${campaign.id}/toggle-status/?org_id=${orgId}`);
      const newStatus: string = res.data.status?.toUpperCase();
      setOptimisticStatus(newStatus);
      onStatusToggle(campaign.id, newStatus);
      toast.success(res.data.message || `Campaign status updated to ${newStatus}.`);
    } catch (err: any) {
      console.error("Error toggling status:", err);
      setOptimisticStatus(prevStatus);
      toast.error(err.response?.data?.error || "Failed to toggle status.");
    } finally {
      setToggling(false);
    }
  };

  const platforms =
    campaign.platforms && campaign.platforms.length > 0
      ? campaign.platforms
      : campaign.draft_data?.platforms || [];

  const status = optimisticStatus ?? campaign.status?.toUpperCase() ?? "DRAFT";
  const isDraft = status === "DRAFT";
  const isPaused = status === "PAUSED";
  const isActive = status === "ACTIVE";

  // Trends come from the backend; "—" when there is no data to compare yet.
  const ctrTrend = campaign.ctr_trend ?? "—";
  const convTrend = campaign.conversions_trend ?? "—";
  const roasTrend = campaign.roas_trend ?? "—";

  const isCtrPositive = !ctrTrend.includes("↓");
  const isConvPositive = !convTrend.includes("↓");
  const isRoasPositive = !roasTrend.includes("↓");
  const noTrendData = (trend: string) => isDraft || trend === "—";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between relative group">
      {/* CARD TOP ROW */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 truncate flex-1" title={campaign.name}>
            {campaign.name}
          </h3>

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-slate-100 bg-white shadow-xl p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  to={`/user-dashboard/campaigns-view-details/${campaign.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Details</span>
                </Link>
                <Link
                  to={`/user-dashboard/campaigns-update/${campaign.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={handleToggleStatus}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pause Campaign</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDuplicate(campaign)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duplicate</span>
                </button>
                <div className="border-t border-slate-100 my-0.5" />
                <button
                  onClick={() => onDelete(campaign.id, campaign.name)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BADGES & PLATFORM LOGOS */}
        <div className="mt-2.5 flex items-center flex-wrap gap-2">
          {/* Status Badge */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase ${
              isActive
                ? "bg-emerald-100/80 text-emerald-700"
                : isPaused
                ? "bg-amber-100/80 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {status}
          </span>

          {/* Objective Badge */}
          {campaign.objective && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
              {campaign.objective.replace(/_/g, " ")}
            </span>
          )}

          {/* Platform Logos */}
          <div className="flex items-center gap-1.5 ml-auto">
            {platforms.some((p: string) => p.toUpperCase().includes("META") || p.toUpperCase().includes("FACEBOOK")) && (
              <span title="Meta / Facebook">
                <MetaIcon />
              </span>
            )}
            {platforms.some((p: string) => p.toUpperCase().includes("GOOGLE")) && (
              <span title="Google Ads">
                <GoogleIcon />
              </span>
            )}
            {platforms.some((p: string) => p.toUpperCase().includes("TIKTOK")) && (
              <span title="TikTok">
                <TikTokIcon />
              </span>
            )}
          </div>
        </div>

        {/* PRIMARY METRICS GRID */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Budget</div>
            <div className="font-bold text-slate-900 mt-0.5">{getBudgetDisplay(campaign)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Spend</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {formatCurrency(campaign.total_spent || 0, campaign.currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Impressions</div>
            <div className="font-bold text-slate-900 mt-0.5">{formatNumber(campaign.impressions || 0)}</div>
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS KPI BOX (CTR, CONVERSIONS, ROAS) */}
      <div className="mt-4">
        <div className="bg-slate-50/80 border border-slate-100/80 rounded-xl p-2.5 grid grid-cols-3 gap-1 text-center">
          {/* CTR */}
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">CTR</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {formatPercentage(campaign.ctr || 0)}
            </div>
            <div
              className={`text-[9px] font-semibold mt-0.5 ${
                noTrendData(ctrTrend) ? "text-slate-400" : isCtrPositive ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {ctrTrend}
            </div>
          </div>

          {/* Conversions */}
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Conversions</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {formatNumber(campaign.conversions || 0)}
            </div>
            <div
              className={`text-[9px] font-semibold mt-0.5 ${
                noTrendData(convTrend) ? "text-slate-400" : isConvPositive ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {convTrend}
            </div>
          </div>

          {/* ROAS */}
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ROAS</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {campaign.roas ? `${campaign.roas.toFixed(1)}x` : "0.0x"}
            </div>
            <div
              className={`text-[9px] font-semibold mt-0.5 ${
                noTrendData(roasTrend) ? "text-slate-400" : isRoasPositive ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {roasTrend}
            </div>
          </div>
        </div>

        {/* BOTTOM SPARKLINE CURVE WAVE */}
        <CardSparkline status={status} id={campaign.id} data={campaign.sparkline_data} />

        {/* CARD FOOTER */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="text-[11px] font-medium">{formatToLocalDate(campaign.created_at)}</span>
          <Link
            to={`/user-dashboard/campaigns-view-details/${campaign.id}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View Details</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
