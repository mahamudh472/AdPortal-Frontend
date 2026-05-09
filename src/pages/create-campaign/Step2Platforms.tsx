import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Settings } from "lucide-react";
// import { useCampaign } from "./CampaignContext";
import { useNavigate, Link } from "react-router";
import type { PlatformItem } from "@/types/createCampaignStep1";
import type { PlatformKey } from "./CampaignContext";
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
  tiktok: "TIKTOK",
  instagram: "INSTAGRAM",
  linkedin: "LINKEDIN",
  twitter: "TWITTER",
  pinterest: "PINTEREST",
};

const Step2Platforms: React.FC = () => {
  // const { campaignData, updateCampaignData } = useCampaign();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({});
  const [integrationLoading, setIntegrationLoading] = useState(true);
  
  const campaignId = localStorage.getItem("campaignId");
  const hasAnyConnectedPlatform = Object.values(integrationStatus).some(status => status === true);

  const [selected, setSelected] = useState<PlatformKey[]>([]);

  const togglePlatform = (key: PlatformKey) => {
    const apiKey = platformToApiValue[key];
    if (!integrationStatus[apiKey]) return;
    setSelected((prev) => {
      const newSelected = prev.includes(key) 
        ? prev.filter((p) => p !== key) 
        : [...prev, key];
      
      // updateCampaignData('step2', {
      //   platforms: PLATFORMS,
      //   selectedPlatforms: newSelected
      // });
      
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
    setDebugInfo("");

    try {
      const apiPlatforms = selected.map(key => platformToApiValue[key]);

      const selectedOrg = localStorage.getItem("selectedOrganization");
      let org_id = "";
      if (selectedOrg) {
        const orgData = JSON.parse(selectedOrg);
        org_id = orgData.id;
      }

      // ★★★ Log the request data ★★★
      const requestData = {
        campaign_id: parseInt(campaignId),
        platforms: apiPlatforms
      };
      
      console.log(" Sending request:", {
        url: `/main/create-ad/?org_id=${org_id}`,
        data: requestData
      });


      const response = await api.post(`/main/create-ad/?org_id=${org_id}`, requestData);

      console.log(" Platforms saved:", response.data);
      navigate("/user-dashboard/campaigns-create/step-3");

    } catch (err: unknown) {
      console.error(" Full error:", err);
      const e = err as { response?: { data: unknown; status: number; headers: unknown }; request?: unknown; message?: string };
      if (e.response) {
        console.error("Error response data:", e.response.data);
        console.error("Error response status:", e.response.status);
        setError((e.response.data as { message?: string })?.message || "Failed to save platforms");
        setDebugInfo(JSON.stringify(e.response.data, null, 2));
      } else if (e.request) {
        console.error("No response received:", e.request);
        setError("No response from server");
      } else {
        console.error("Error setting up request:", e.message);
        setError("Request setup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchIntegrationStatus = async () => {
      const selectedOrg = localStorage.getItem("selectedOrganization");
      let org_id = "";
      if (selectedOrg) {
        const orgData = JSON.parse(selectedOrg);
        org_id = orgData.id;
      }
      try {
        const response = await api.get(`/main/integrations-status/?org_id=${org_id}`);
        const statusMap: Record<string, boolean> = {};
        response.data.integrations.forEach((item: { platform: string; status: boolean }) => {
          statusMap[item.platform] = item.status;
        });
        setIntegrationStatus(statusMap);
      } catch (err) {
        console.error("Failed to fetch integration status:", err);
      } finally {
        setIntegrationLoading(false);
      }
    };

    fetchIntegrationStatus();
    if (!campaignId) {
      console.warn(" No campaign ID found in localStorage");
    }
  }, [campaignId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Select Platforms
        </h2>
        <p className="text-sm text-slate-500">
          Choose where you want to run your campaign. You can select multiple
          platforms.
        </p>
        
        {campaignId && (
          <p className="text-xs text-gray-400 mt-1">
            Campaign ID: {campaignId} (from localStorage)
          </p>
        )}
      </div>

      {/* Error message with debug info */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          {debugInfo && (
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
              {debugInfo}
            </pre>
          )}
        </div>
      )}

      {/* No Connections Warning */}
      {!integrationLoading && !hasAnyConnectedPlatform && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-amber-600" size={24} />
          </div>
          <h3 className="text-amber-900 font-semibold">No Ad Accounts Connected</h3>
          <p className="text-amber-700 text-sm mt-1 max-w-sm">
            You need to connect your Meta, Google, or TikTok ad accounts in settings before you can select platforms and run campaigns.
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
        {integrationLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          PLATFORMS.map((platform) => {
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
          })
        )}
      </div>

      {/* Selected Platforms Preview */}
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
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-5">
        <Link
          to="/user-dashboard/campaigns-create/step-1"
          className="btn md:w-40 text-gray-700 border rounded-xl border-gray-700 hover:bg-gray-400 hover:text-white"
        >
          Previous
        </Link>

        <button
          onClick={handleSubmit}
          disabled={loading || selected.length === 0 || !campaignId}
          className="btn md:w-40 text-white bg-blue-600 hover:bg-blue-700 rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Step2Platforms;