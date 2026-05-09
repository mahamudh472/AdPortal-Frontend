import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Settings } from "lucide-react";
import { useNavigate, Link, useParams } from "react-router";
import type { PlatformItem, PlatformKey } from "@/types/createCampaignStep1";
import api from "@/lib/axios";

const PLATFORMS: PlatformItem[] = [
  {
    key: "facebook",
    name: "Meta (Facebook)",
    description: "Reach billions of users across Facebook",
    connected: true,
    logo: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_10_m3mnnq.png",
  },
  {
    key: "google",
    name: "Google Ads",
    description: "Show ads on Google Search, YouTube, and Display Network",
    connected: true,
    logo: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_11_bdja1x.png",
  },
  {
    key: "tiktok",
    name: "TikTok Ads",
    description: "Engage with Gen Z and millennials on TikTok",
    connected: true,
    logo: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_12_siwhfp.png",
  },
];

const platformToApiValue: Record<PlatformKey, string> = {
  facebook: "META",
  google: "GOOGLE",
  tiktok: "TIKTOK"
};

const apiValueToPlatform: Record<string, PlatformKey> = {
  "META": "facebook",
  "GOOGLE": "google",
  "TIKTOK": "tiktok"
};

const Step2Platforms: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selected, setSelected] = useState<PlatformKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaignData, setCampaignData] = useState<{ id: number; status: string; platforms: string[] } | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({});
  const hasAnyConnectedPlatform = Object.values(integrationStatus).some(status => status === true);
  
  const campaignId = id || localStorage.getItem("campaignId");

  const getOrgId = () => {
    try {
      const selectedOrg = localStorage.getItem("selectedOrganization");
      if (selectedOrg) {
        const orgData = JSON.parse(selectedOrg);
        return orgData.id;
      }
      return null;
    } catch (error) {
      console.error("Error parsing organization data:", error);
      return null;
    }
  };

  const fetchCampaignData = async () => {
    if (!campaignId) {
      setError("Campaign ID not found");
      setFetchLoading(false);
      return;
    }

    const org_id = getOrgId();
    if (!org_id) {
      setError("No organization selected");
      setFetchLoading(false);
      return;
    }

    try {
      const [campaignResponse, integrationResponse] = await Promise.all([
        api.get(`/main/campaign/${campaignId}/?org_id=${org_id}`),
        api.get(`/main/integrations-status/?org_id=${org_id}`),
      ]);

      console.log("📥 Campaign data:", campaignResponse.data);
      setCampaignData(campaignResponse.data);

      const statusMap: Record<string, boolean> = {};
      (integrationResponse.data.integrations as { platform: string; status: boolean }[]).forEach((item) => {
        statusMap[item.platform] = item.status;
      });
      setIntegrationStatus(statusMap);

      const apiPlatforms = campaignResponse.data.platforms || [];
      const selectedPlatforms = apiPlatforms
        .map((apiPlatform: string) => apiValueToPlatform[apiPlatform])
        .filter((platform: PlatformKey | undefined) => platform !== undefined);

      console.log("Selected platforms from API:", selectedPlatforms);
      setSelected(selectedPlatforms);

    } catch (err: unknown) {
      console.error("Error fetching campaign:", err);
      const e = err as { response?: { data: { message?: string } } };
      setError(e.response?.data?.message || "Failed to fetch campaign data");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const togglePlatform = (key: PlatformKey) => {
    const apiKey = platformToApiValue[key];
    if (!integrationStatus[apiKey]) return;
    setSelected((prev) => {
      const newSelected = prev.includes(key) 
        ? prev.filter((p) => p !== key) 
        : [...prev, key];
      
      return newSelected;
    });
  };

  const handleSubmit = async () => {
    if (!campaignId) {
      setError("Campaign ID not found. Please go back to Step 1.");
      return;
    }

    if (selected.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiPlatforms = selected.map(key => platformToApiValue[key]);

      const org_id = getOrgId();
      if (!org_id) {
        setError("No organization selected");
        setLoading(false);
        return;
      }

      // API তে যেভাবে ডাটা পাঠাতে হবে (POST method এ)
      const requestData = {
        campaign_id: parseInt(campaignId),
        platforms: apiPlatforms
      };

      console.log("📤 Updating platforms with POST:", {
        url: `/main/update-ad/?org_id=${org_id}`,
        data: requestData
      });

      // POST method ব্যবহার করে আপডেট করা
      const response = await api.post(`/main/update-ad/?org_id=${org_id}`, requestData);

      console.log("✅ Platforms updated successfully:", response.data);
      console.log(`🎯 Campaign #${campaignId} platforms updated to:`, apiPlatforms);

      navigate(`/user-dashboard/campaigns-update/${campaignId}/update-step-3`);

    } catch (err: unknown) {
      console.error("❌ Error updating platforms:", err);
      const e = err as { response?: { data: { message?: string } } };
      setError(e.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!campaignId) {
      console.warn("⚠️ No campaign ID found");
    }
  }, [campaignId]);

  if (fetchLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Update Select Platforms
          </h2>
          <p className="text-sm text-slate-500">
            Loading your campaign platforms...
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading platform data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Update Select Platforms
        </h2>
        <p className="text-sm text-slate-500">
          Choose where you want to run your campaign. You can select multiple
          platforms.
        </p>
        
        {campaignId && campaignData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-xs font-medium text-blue-800">
              Campaign ID: <span className="font-bold">{campaignData.id}</span> | 
              Status: <span className="font-bold">{campaignData.status}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Current Platforms: {campaignData.platforms?.length > 0 
                ? campaignData.platforms.join(', ') 
                : 'None selected'}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* No Connections Warning */}
      {!fetchLoading && !hasAnyConnectedPlatform && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-amber-600" size={24} />
          </div>
          <h3 className="text-amber-900 font-semibold">No Ad Accounts Connected</h3>
          <p className="text-amber-700 text-sm mt-1 max-w-sm">
            You need to connect your Meta, Google, or TikTok ad accounts in settings before you can update platforms and run campaigns.
          </p>
          <Link 
            to="/user-dashboard/settings" 
            className="mt-4 flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition shadow-sm"
          >
            <Settings size={16} />
            Go to Settings
          </Link>
        </div>
      )}

      {/* Platform Cards */}
      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform.key);
          const isConnected = integrationStatus[platformToApiValue[platform.key]] === true;

          return (
            <div
              key={platform.key}
              onClick={() => !loading && isConnected && togglePlatform(platform.key)}
              className={`rounded-xl border p-4 flex items-center justify-between transition
                ${!isConnected ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : isConnected ? "border-slate-200 hover:border-slate-300" : "border-slate-200"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-white">
                  <img
                    src={platform.logo}
                    alt={platform.name}
                    className="object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {platform.name}
                    </p>

                    {isConnected ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Connected
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Not Connected
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500">
                    {platform.description}
                  </p>
                </div>
              </div>

              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border
                  ${
                    isSelected
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white"
                  }
                `}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Platforms Preview with campaign_id */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Selected Platforms (API format):
        </p>

        <div className="flex flex-wrap gap-2">
          {selected.map((key) => (
            <span
              key={key}
              className="rounded-full border border-blue-500 bg-white px-3 py-1 text-xs font-medium text-blue-600"
            >
              {platformToApiValue[key]}
            </span>
          ))}
          
          {selected.length === 0 && (
            <p className="text-sm text-slate-500 italic">
              No platforms selected yet
            </p>
          )}
        </div>

        {/* API Request Preview with campaign_id */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs font-medium text-blue-800 mb-2">
            🔄 Will Update Campaign #{campaignId} with (POST Request):
          </p>
          <pre className="text-xs bg-white p-3 rounded-lg border border-blue-100 overflow-auto">
            {JSON.stringify({
              campaign_id: parseInt(campaignId || "0"),
              platforms: selected.map(key => platformToApiValue[key])
            }, null, 2)}
          </pre>
          <p className="text-xs text-blue-600 mt-2">
            ✓ POST Request to: /main/update-ad/?org_id={getOrgId()}
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-5">
        <Link
          to={`/user-dashboard/campaigns-update/${campaignId}/update-step-1`}
          className="btn md:w-40 text-gray-700 border rounded-xl border-gray-700 hover:bg-gray-400 hover:text-white"
        >
          Previous
        </Link>

        <button
          onClick={handleSubmit}
          disabled={loading || selected.length === 0 || !campaignId}
          className="btn md:w-40 text-white bg-blue-600 hover:bg-blue-700 rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update & Continue"}
        </button>
      </div>
    </div>
  );
};

export default Step2Platforms;