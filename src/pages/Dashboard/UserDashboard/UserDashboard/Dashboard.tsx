import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Sparkles,
  BarChart2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import SpendOverview from "./SpendOverview/SpendOverview";
import CampaignsTable from "./RecentCampaigns/RecentCampaigns";
import api from "@/lib/axios";
import { Link } from "react-router-dom";
import { parseUTCDate, formatToLocalDate } from "@/lib/dateUtils";

// Types for dashboard data
interface DashboardData {
  total_spend: number;
  impressions: number;
  click_rate: number;
  roas: number;
  spend_overview: {
    [key: string]: {
      META: number;
      GOOGLE: number;
      TIKTOK: number;
    };
  };
  ai_insights: Array<{
    id: number;
    title: string;
    description: string;
    created_at: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
  }>;
  recent_campaigns: Array<{
    id: number;
    name: string;
    status: string;
    platforms: string[];
    created_at: string;
    spend: number;
    performance: {
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      roas: number;
    };
  }>;
}

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format large numbers
const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toString();
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return value.toFixed(2) + "%";
};

function StatCard({
  label,
  value,
  delta,
  positive = true,
  iconImg,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  positive?: boolean;
  iconImg: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src={iconImg} alt="icon" className="w-10 h-10 object-contain" />
        </div>

        {delta && (
          <div
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {delta}
          </div>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  bgClass,
  Icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  bgClass: string;
  Icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${bgClass} rounded-2xl cursor-pointer p-6 text-left shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-md bg-white/20 p-2">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/90">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

// Delete Confirmation Modal Component
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
          <span className="font-semibold">"{campaignName}"</span>? This action
          cannot be undone.
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

const ICONS = {
  dollar:
    "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765494156/Container_6_h2gdjc.png",
  eye: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765494155/Container_7_dlwyhq.png",
  cursor:
    "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765494155/Container_8_y2rgps.png",
  ROAS: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765494155/Container_9_apjmto.png",
};

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  // Get org_id from selectedOrganization in localStorage
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
      setError(null);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please refresh or login again.");
      } else {
        setError("Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete campaign
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
      // Make API call to delete campaign
      const response = await api.delete(
        `/main/campaign/${deleteModal.campaignId}/?org_id=${orgId}`,
      );

      console.log("✅ Campaign deleted successfully:", response.data);

      // Remove campaign from local state
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recent_campaigns: prev.recent_campaigns.filter(
            (c) => c.id !== deleteModal.campaignId,
          ),
        };
      });

      // Close modal
      setDeleteModal({ isOpen: false, campaignId: null, campaignName: "" });

      // Show success toast
      toast.success("Campaign deleted successfully!", {
        duration: 3000,
        position: "top-center",
      });
    } catch (err: any) {
      console.error("❌ Campaign delete failed:", err);

      // Handle specific error cases
      if (err.response?.status === 403) {
        toast.error("You do not have permission to delete this campaign.", {
          duration: 5000,
          position: "top-center",
        });
      } else if (err.response?.status === 404) {
        toast.error("Campaign not found. It may have been already deleted.", {
          duration: 5000,
          position: "top-center",
        });

        // Remove from UI anyway
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recent_campaigns: prev.recent_campaigns.filter(
              (c) => c.id !== deleteModal.campaignId,
            ),
          };
        });

        setDeleteModal({ isOpen: false, campaignId: null, campaignName: "" });
      } else {
        toast.error(
          err.response?.data?.message || "Failed to delete campaign",
          {
            duration: 5000,
            position: "top-center",
          },
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, campaignId: null, campaignName: "" });
  };

  // Format the last updated time
  const getLastUpdatedText = () => {
    if (!dashboardData?.ai_insights || dashboardData.ai_insights.length === 0) {
      return "2 minutes ago";
    }
    const latestInsight = dashboardData.ai_insights.sort(
      (a, b) => {
        const timeA = parseUTCDate(a.created_at)?.getTime() || 0;
        const timeB = parseUTCDate(b.created_at)?.getTime() || 0;
        return timeB - timeA;
      }
    )[0];

    const updatedTime = parseUTCDate(latestInsight.created_at);
    if (!updatedTime) return "—";
    const now = new Date();
    const diffMs = now.getTime() - updatedTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return formatToLocalDate(updatedTime);
  };

  if (loading) {
    return (
      <main className="p">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error || !orgId) {
    return (
      <main className="">
        <div className="text-center text-red-600  p-4 rounded-lg">
          {error || (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 text-center max-w-sm w-full">
                <div className="text-lg font-semibold text-gray-800 mb-4">
                  No organization selected please sign in again
                </div>

                <Link to="/auth/signin">
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Please Sign In 
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        campaignName={deleteModal.campaignName}
        loading={deleteLoading}
      />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between p-2">
        <div>
          <div className="mb-1 lg:flex  items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <span className="inline-flex mt-2 items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span>AI Powered</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Welcome back! Here's your campaign overview with AI insights.
          </p>
        </div>

        <div className="text-right text-sm text-gray-500">
          <div className="text-xs">Last updated</div>
          <div className="mt-1 font-medium text-gray-700">
            {getLastUpdatedText()}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 p-2">
        <StatCard
          iconImg={ICONS.dollar}
          label="Total Spend"
          value={formatCurrency(dashboardData?.total_spend || 0)}
          delta="+12.3%"
          positive
        />
        <StatCard
          iconImg={ICONS.eye}
          label="Impressions"
          value={formatNumber(dashboardData?.impressions || 0)}
          delta="+8.2%"
          positive
        />
        <StatCard
          iconImg={ICONS.cursor}
          label="Click Rate"
          value={formatPercentage(dashboardData?.click_rate || 0)}
          delta="-0.5%"
          positive={false}
        />
        <StatCard
          iconImg={ICONS.ROAS}
          label="ROAS"
          value={(dashboardData?.roas || 0).toFixed(1) + "x"}
          delta="+15.8%"
          positive
        />
      </div>

      {/* Quick Actions */}
      <section className="rounded-xl bg-white p-6 shadow-sm p-2">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ActionCard
            title="Create Campaign"
            subtitle="Start a new ad campaign"
            bgClass="bg-blue-600"
            Icon={Plus}
            onClick={() => navigate("/user-dashboard/campaigns-create/step-1")}
          />

          <ActionCard
            title="AI Copy Generator"
            subtitle="Create ad copy with AI"
            bgClass="bg-purple-700"
            Icon={Sparkles}
            onClick={() => navigate("/user-dashboard/ai-tools")}
          />

          <ActionCard
            title="View Reports"
            subtitle="Check performance data"
            bgClass="bg-green-600"
            Icon={BarChart2}
            onClick={() => navigate("/user-dashboard/reports")}
          />
        </div>
      </section>

      {/* Spend Overview */}
      <div className="mt-5">
        <SpendOverview
          data={dashboardData?.spend_overview}
          aiInsights={dashboardData?.ai_insights}
        />
      </div>

      {/* Recent Campaigns */}
      <div className="mt-4">
        <CampaignsTable
          campaigns={dashboardData?.recent_campaigns || []}
          onDelete={handleDeleteClick}
        />
      </div>
    </main>
  );
};

export default UserDashboard;
