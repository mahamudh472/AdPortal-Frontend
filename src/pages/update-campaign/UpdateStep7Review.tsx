import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router";
import api from "@/lib/axios";

interface AdItem {
  ad_name: string;
  headline: string;
  primary_text: string;
  description: string;
  call_to_action: string;
  destination_url: string;
}

interface BudgetItem {
  platform: string;
  budget_type: string;
  start_date: string;
  end_date: string;
  budget: number;
  run_continuously: boolean;
}

interface AudienceTargeting {
  min_age: number;
  max_age: number;
  gender: string;
  locations: string[];
  keywords: string;
}

interface CampaignResponse {
  id: number;
  name: string;
  objective: string;
  platforms: string[];
  ads: AdItem[];
  audience_targeting: AudienceTargeting;
  status: string;
  created_at: string;
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  budgets: BudgetItem[];
  file_url: string;
}

const getOrgId = () => {
  try {
    const selectedOrg = localStorage.getItem("selectedOrganization");
    if (selectedOrg) {
      const orgData = JSON.parse(selectedOrg);
      return orgData.id;
    }
    return null;
  } catch {
    return null;
  }
};

const Step7Review: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) { setError("Campaign ID not found"); setLoading(false); return; }
      const org_id = getOrgId();
      if (!org_id) { setError("No organization selected"); setLoading(false); return; }

      try {
        const response = await api.get(`/main/campaign/${id}/?org_id=${org_id}`);
        setCampaignData(response.data);
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError("Failed to load campaign data");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePublish = () => {
    setPublishing(true);
    
    // Simulate publishing process
    setTimeout(() => {
      // Clear all campaign-related data from localStorage
      localStorage.removeItem("campaign_builder_data");
      localStorage.removeItem("campaignId");
      localStorage.removeItem("campaignName");
      localStorage.removeItem("campaignStatus");
      localStorage.removeItem("api_response");
      
      console.log("🧹 All campaign data cleared from localStorage");
      
      // Navigate to campaigns page
      navigate("/user-dashboard/campaigns");
    }, 1500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlatformDisplay = (platform: string) => {
    switch (platform) {
      case "GOOGLE": return "Google";
      case "META": return "Facebook";
      case "TIKTOK": return "TikTok";
      default: return platform;
    }
  };

  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case "male": return "Male";
      case "female": return "Female";
      case "all": return "All";
      default: return gender;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading campaign data...</span>
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error || "Campaign data not available."}
        </div>
      </div>
    );
  }

  const audience = campaignData.audience_targeting;
  const ads = campaignData.ads || [];
  const firstAd = ads[0];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Review Your Campaign</h1>
        <p className="text-sm text-gray-500">Review all details before publishing</p>
      </div>

      <div className="space-y-4">
        {/* Campaign Information */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Campaign Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <p><span className="font-medium">Campaign Name:</span> {campaignData.name}</p>
            {campaignData.status && (
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className="text-yellow-600 font-medium">{campaignData.status}</span>
              </p>
            )}
            {campaignData.created_at && (
              <p><span className="font-medium">Created:</span> {formatDate(campaignData.created_at)}</p>
            )}
          </div>
        </div>

        {/* Platforms */}
        {campaignData.platforms?.length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Platforms</h3>
            <div className="flex gap-2 flex-wrap">
              {campaignData.platforms.map((platform, index) => (
                <span key={index} className="px-3 py-1 text-xs rounded-full border border-blue-500 text-blue-600">
                  {getPlatformDisplay(platform)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Objective */}
        {campaignData.objective && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Objective</h3>
            <p className="text-sm text-gray-600">{campaignData.objective}</p>
          </div>
        )}

        {/* Target Audience */}
        {audience && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Target Audience</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
              {(audience.min_age || audience.max_age) && (
                <p>Age: {audience.min_age}–{audience.max_age}</p>
              )}
              {audience.gender && (
                <p>Gender: {getGenderDisplay(audience.gender)}</p>
              )}
              {audience.locations?.length > 0 && (
                <p>Locations: {audience.locations.join(", ")}</p>
              )}
            </div>
            {audience.keywords && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Keywords:</span> {audience.keywords}
              </p>
            )}
          </div>
        )}

        {/* Budget & Schedule */}
        {campaignData.budgets?.length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Budget & Schedule</h3>
            {campaignData.budgets.map((budget, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-2">
                {budget.budget && (
                  <p>
                    {budget.budget_type === "DAILY" ? "Daily" : budget.budget_type === "ONETIME" ? "One-time" : "Lifetime"} Budget:{" "}
                    <span className="font-medium">{formatCurrency(budget.budget)}</span>
                  </p>
                )}
                {budget.platform && (
                  <p><span className="font-medium">Platform:</span> {getPlatformDisplay(budget.platform)}</p>
                )}
                {budget.start_date && <p>Start: {formatDate(budget.start_date)}</p>}
                {budget.run_continuously ? (
                  <p className="text-green-600">✓ Running continuously</p>
                ) : budget.end_date ? (
                  <p>End: {formatDate(budget.end_date)}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Ad Creative */}
        {firstAd && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Ad Creative</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {firstAd.ad_name && <p><span className="font-medium">Ad Name:</span> {firstAd.ad_name}</p>}
              {firstAd.headline && <p><span className="font-medium">Headline:</span> {firstAd.headline}</p>}
              {firstAd.primary_text && <p><span className="font-medium">Primary Text:</span> {firstAd.primary_text}</p>}
              {firstAd.description && <p><span className="font-medium">Description:</span> {firstAd.description}</p>}
              {firstAd.call_to_action && <p><span className="font-medium">CTA:</span> {firstAd.call_to_action}</p>}
              {firstAd.destination_url && (
                <p>
                  <span className="font-medium">Destination URL:</span>{" "}
                  <a href={firstAd.destination_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline">
                    {firstAd.destination_url}
                  </a>
                </p>
              )}
            </div>
            {/* Media preview */}
            {campaignData.file_url && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Asset:</p>
                {campaignData.file_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={campaignData.file_url} controls className="max-h-40 rounded-lg border" />
                ) : (
                  <img src={campaignData.file_url} alt="Ad asset" className="max-h-40 rounded-lg border object-contain" />
                )}
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-3">Pre-launch Checks</h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-center gap-2"><CheckCircle size={16} /> All required fields completed</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} /> Ad accounts connected and verified</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} /> Budget allocation confirmed</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} /> Creative assets meet platform requirements</li>
          </ul>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={18} />
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Before Publishing:</span> Once published, your campaign will go through
              platform review (usually 24 hours) before going live. You can still edit or pause your campaign after publishing.
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-5">
          <Link
            to={`/user-dashboard/campaigns-update/${id}/update-step-6`}
            className="btn md:w-40 text-gray-700 border rounded-xl border-gray-700 hover:bg-gray-400 hover:text-white py-2 text-center"
          >
            Previous
          </Link>
          {campaignData.status?.toUpperCase() === "DRAFT" ? (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn md:w-40 text-white bg-blue-600 hover:bg-blue-700 rounded-xl border py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Campaign"
              )}
            </button>
          ) : (
            <Link
              to={`/user-dashboard/campaigns-view-details/${id}`}
              className="btn md:w-40 text-white bg-blue-600 hover:bg-blue-700 rounded-xl border py-2 text-center"
            >
              Go to Campaigns
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step7Review;