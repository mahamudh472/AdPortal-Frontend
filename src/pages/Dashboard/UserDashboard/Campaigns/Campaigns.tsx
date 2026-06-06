

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Link } from "react-router";

import Swal from "sweetalert2";
import api from "@/lib/axios";
import { toast } from "sonner";
import pushIcon from "../../../../assets/pushicon.svg"

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
}

interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  danger?: boolean;
  onClick?: () => void;
}

interface BadgeProps {
  status: string;
}

interface KpiProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface StatProps {
  label: string;
  value: string | number;
}

interface ChipProps {
  children: React.ReactNode;
}

const ACTION_BTN =
  "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765671112/Button_2_upzjmx.png";

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, paused: 0, draft: 0 });
  const PAGE_SIZE = 10;

  // Get org_id from localStorage
  const getOrgId = (): string => {
    try {
      const selectedOrg = localStorage.getItem("selectedOrganization");
      if (selectedOrg) {
        const orgData = JSON.parse(selectedOrg);
        if (orgData && orgData.id) {
          return orgData.id;
        }
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
      const params = new URLSearchParams({ org_id: orgId, page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter.toUpperCase());
      const response = await api.get(`/main/campaigns/?${params.toString()}`);
      const results = response.data.results || [];
      setCampaigns(results);
      setFilteredCampaigns(results);
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
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Show loading state
        Swal.fire({
          title: "Deleting...",
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Call delete API
        await api.delete(`/main/campaign/${id}/?org_id=${orgId}`);

        // Re-fetch current page (go to previous page if last item on page was deleted)
        const remaining = campaigns.filter((c) => c.id !== id).length;
        const newPage = remaining === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        if (newPage === currentPage) fetchCampaigns(currentPage, searchTerm, activeFilter);
        fetchStatusCounts();

        // Show success message
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: `Campaign "${name}" has been deleted successfully.`,
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (err: any) {
        console.error("Error deleting campaign:", err);

        // Show error message
        Swal.fire({
          icon: "error",
          title: "Error!",
          text:
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.response?.data?.detail ||
            "Failed to delete campaign. Please try again.",
          confirmButtonColor: "#3085d6",
        });
      }
    }
  };

  const handleDuplicate = async (_campaign: Campaign) => {
    try {
      Swal.fire({
        icon: "info",
        title: "Coming Soon",
        text: "Duplicate functionality will be available soon!",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Error duplicating campaign:", err);
    }
  };

  const getStatusCount = (status: string) => {
    return statusCounts[status as keyof typeof statusCounts] ?? 0;
  };

  // Format currency
  const formatCurrency = (value: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format large numbers
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + "K";
    }
    return value.toString();
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return value.toFixed(2) + "%";
  };

  // Get platform display names
  const getPlatformDisplayNames = (platforms: string[]) => {
    return platforms.map((p) => {
      switch (p.toUpperCase()) {
        case "META":
        case "FACEBOOK":
          return "Meta";
        case "GOOGLE":
          return "Google";
        case "TIKTOK":
          return "TikTok";
        default:
          return p;
      }
    });
  };

  // Get budget display
  const getBudgetDisplay = (campaign: Campaign): string => {
    if (
      campaign.draft_data?.budgets &&
      campaign.draft_data.budgets.length > 0
    ) {
      const totalBudget = campaign.draft_data.budgets.reduce(
        (sum: number, b: any) => sum + (b.budget || 0),
        0,
      );
      if (totalBudget > 0) {
        return `${formatCurrency(totalBudget, campaign.currency)}/day`;
      }
    }
    return formatCurrency(campaign.total_budget, campaign.currency);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
          {error}
          <button
            onClick={() => fetchCampaigns(currentPage)}
            className="block mx-auto mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=" space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500">
            Manage and monitor all your ad campaigns
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-lg border cursor-pointer border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            onClick={async () => {
              if (!orgId) {
                Swal.fire({
                  icon: "error",
                  title: "No organization selected",
                  text: "Please select an organization first.",
                  confirmButtonColor: "#3085d6",
                });
                return;
              }
              try {
                await api.post(`/main/sync-ads/?org_id=${orgId}`);
                toast.success(
                  "ads syncing initiated successfully! It may take a few moments for the changes to reflect.",
                );
                // Optionally, refresh campaigns after sync
                fetchCampaigns(currentPage, searchTerm, activeFilter);
              } catch (err: any) {
                console.error("Error syncing ads:", err);
                Swal.fire({
                  icon: "error",
                  title: "Sync Failed",
                  text:
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    "Failed to sync ads. Please try again.",
                  confirmButtonColor: "#3085d6",
                });
              }
            }}
          >
            Sync your Ad
          </button>

          <Link
            to="/user-dashboard/campaigns-create"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Add Campaign
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 rounded-xl border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveFilter("all"); setCurrentPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${
                activeFilter === "all"
                  ? "bg-[#2D6FF8] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              All ({getStatusCount("all")})
            </button>

            <button
              onClick={() => { setActiveFilter("active"); setCurrentPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeFilter === "active"
                  ? "bg-[#2D6FF8] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Active ({getStatusCount("active")})
            </button>

            <button
              onClick={() => { setActiveFilter("paused"); setCurrentPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeFilter === "paused"
                  ? "bg-[#2D6FF8] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Paused ({getStatusCount("paused")})
            </button>

            <button
              onClick={() => { setActiveFilter("draft"); setCurrentPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeFilter === "draft"
                  ? "bg-[#2D6FF8] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Draft ({getStatusCount("draft")})
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Cards */}
      {filteredCampaigns.length > 0 ? (
        <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 p-2">
          {filteredCampaigns.map((item) => (
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
              getPlatformDisplayNames={getPlatformDisplayNames}
              getBudgetDisplay={getBudgetDisplay}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (() => {
          const totalPages = Math.ceil(totalCount / PAGE_SIZE);
          const startItem = (currentPage - 1) * PAGE_SIZE + 1;
          const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

          const getPageNumbers = () => {
            const pages: (number | "...")[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (currentPage > 3) pages.push("...");
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
              if (currentPage < totalPages - 2) pages.push("...");
              pages.push(totalPages);
            }
            return pages;
          };

          return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4">
              <p className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-700">{startItem}</span>–<span className="font-medium text-slate-700">{endItem}</span> of <span className="font-medium text-slate-700">{totalCount}</span> campaigns
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={15} /> Prev
                </button>

                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 select-none">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[36px] rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        currentPage === page
                          ? "bg-[#2D6FF8] border-[#2D6FF8] text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          );
        })()}
        </>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-auto my-10 shadow-sm border border-gray-200">
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
  getPlatformDisplayNames: (platforms: string[]) => string[];
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
  getPlatformDisplayNames,
  getBudgetDisplay,
}) => {
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(campaign.status?.toUpperCase());

  const handleToggleStatus = async () => {
    if (toggling) return;
    const prevStatus = optimisticStatus;
    const nextStatus = prevStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setOptimisticStatus(nextStatus); // instant UI flip
    setToggling(true);
    try {
      const res = await api.post(
        `/main/campaign/${campaign.id}/toggle-status/?org_id=${orgId}`
      );
      const newStatus: string = res.data.status?.toUpperCase();
      setOptimisticStatus(newStatus);
      onStatusToggle(campaign.id, newStatus);
      toast.success(res.data.message || `Campaign status updated to ${newStatus}.`);
    } catch (err: any) {
      console.error("Error toggling campaign status:", err);
      setOptimisticStatus(prevStatus); // revert on failure
      toast.error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to toggle campaign status."
      );
    } finally {
      setToggling(false);
    }
  };


  const platforms =
    campaign.platforms && campaign.platforms.length > 0
      ? campaign.platforms
      : campaign.draft_data?.platforms || [];

  const displayPlatforms = getPlatformDisplayNames(platforms);
 

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {campaign.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge status={optimisticStatus ?? campaign.status} />

            <Chip>
              {campaign.objective
                ? campaign.objective.replace(/_/g, " ")
                : "N/A"}
            </Chip>

            {displayPlatforms.map((p: string, idx: number) => (
              <span key={`${p}-${idx}`} className="text-slate-500">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {optimisticStatus === "ACTIVE" && (
            <img
              src={ACTION_BTN}
              alt="pause campaign"
              className={`h-7 w-7 cursor-pointer transition-opacity ${toggling ? "opacity-50 pointer-events-none" : ""}`}
              onClick={handleToggleStatus}
              title="Pause Campaign"
            />
          )}
          {optimisticStatus === "PAUSED" && (
            <img
              src={pushIcon}
              alt="activate campaign"
              className={`h-5 w-5 cursor-pointer transition-opacity ${toggling ? "opacity-50 pointer-events-none" : ""}`}
              onClick={handleToggleStatus}
              title="Activate Campaign"
            />
          )}
          <button onClick={() => setOpen(!open)}>
            <MoreVertical className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <Stat label="Total Budget" value={getBudgetDisplay(campaign)} />
        <Stat
          label="Total Spend"
          value={formatCurrency(campaign.total_spent, campaign.currency)}
        />
        <Stat label="Impressions" value={formatNumber(campaign.impressions)} />
        <Stat label="Clicks" value={formatNumber(campaign.clicks)} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 ">
        <Kpi label="CTR" value={formatPercentage(campaign.ctr)} />
        <Kpi label="Conversions" value={formatNumber(campaign.conversions)} />
        <Kpi
          label="ROAS"
          value={campaign.roas.toFixed(1) + "x"}
          highlight={campaign.roas > 2}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{formatToLocalDate(campaign.created_at)}</span>
        <Link
          to={`/user-dashboard/campaigns-view-details/${campaign.id}`}
          className="text-blue-600 hover:underline"
        >
          View Details →
        </Link>
      </div>

      {open && (
        <div className="absolute right-4 top-12 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-lg">
          <Link to={`/user-dashboard/campaigns-view-details/${campaign.id}`}>
            <MenuItem icon={<Eye size={16} />} text="View Campaign" />
          </Link>
          <Link to={`/user-dashboard/campaigns-update/${campaign.id}`}>
            <MenuItem icon={<Pencil size={16} />} text="Edit Campaign" />
          </Link>
          <MenuItem
            icon={<Copy size={16} />}
            text="Duplicate Campaign"
            onClick={() => onDuplicate(campaign)}
          />
          <div className="border-t" />
          <MenuItem
            icon={<Trash2 size={16} />}
            text="Delete Campaign"
            danger
            onClick={() => onDelete(campaign.id, campaign.name)}
          />
        </div>
      )}
    </div>
  );
};

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-600",
    PAUSED: "bg-yellow-100 text-yellow-600",
    DRAFT: "bg-slate-100 text-slate-500",
    COMPLETED: "bg-blue-100 text-blue-600",
  };

  const statusUpper = status?.toUpperCase() || "DRAFT";

  return (
    <span
      className={`rounded-full px-2 py-0.5 ${map[statusUpper] || map.DRAFT}`}
    >
      {status}
    </span>
  );
};

const Chip: React.FC<ChipProps> = ({ children }) => (
  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
    {children}
  </span>
);

const Stat: React.FC<StatProps> = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="font-medium text-slate-800">{value}</p>
  </div>
);

const Kpi: React.FC<KpiProps> = ({ label, value, highlight }) => (
  <div
    className={`rounded-lg p-3 text-center text-sm ${
      highlight
        ? "bg-green-50 text-green-300 border border-green-100"
        : "bg-slate-50"
    }`}
  >
    <p className="text-xs text-slate-400">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  text,
  danger = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-4 py-3 text-sm ${
      danger ? "text-red-600 hover:bg-red-50" : "hover:bg-slate-50"
    }`}
  >
    {icon}
    {text}
  </button>
);

export default Campaigns;
