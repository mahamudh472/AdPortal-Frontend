import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { formatToLocalDate } from "@/lib/dateUtils";

interface ApiResponse {
  id?: number;
  ad_name?: string;
  ad_format?: string;
  headline?: string;
  primary_text?: string;
  description?: string;
  call_to_action?: string;
  destination_url?: string;
  keywords?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  campaign_id?: number;
  campaign_name?: string;
  platform?: string[];
  objective?: string;
  age_min?: number;
  age_max?: number;
  gender?: string;
  locations?: string[];
  interests?: string[];
  daily_budget?: number;
  start_date?: string;
  end_date?: string;
  is_unlimited?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const Step7Review: React.FC = () => {
  const navigate = useNavigate();
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    // Load API response from localStorage
    try {
      const savedResponse = localStorage.getItem("api_response");
      if (savedResponse) {
        const parsed = JSON.parse(savedResponse);
        setApiResponse(parsed);
        console.log("📦 Loaded API response:", parsed);
      }
    } catch (error) {
      console.error("Error loading API response:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return formatToLocalDate(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle publish button click
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Review Your Campaign</h1>
        <p className="text-sm text-gray-500">
          Review all details before publishing your campaign
        </p>
        {apiResponse?.created_at && (
          <p className="text-xs text-gray-400 mt-1">
            Created: {formatDate(apiResponse.created_at)}
          </p>
        )}
        {apiResponse?.id && (
          <p className="text-xs text-gray-400 mt-1">
            Campaign ID: {apiResponse.id}
          </p>
        )}
      </div>

      {/* Card Wrapper */}
      <div className="space-y-4">
        {/* Campaign Name */}
        {apiResponse?.campaign_name && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Campaign Name
            </h3>
            <p className="text-sm text-gray-600">{apiResponse.campaign_name}</p>
          </div>
        )}

        {/* Platforms */}

     {apiResponse?.platform && apiResponse.platform.length > 0 && (
  <div className="bg-white rounded-xl border p-4">
    <h3 className="text-sm font-semibold text-gray-900 mb-2">
      Platforms
    </h3>

    <div className="flex gap-2 flex-wrap">
      {apiResponse.platform.map((platform: string) => (
        <span
          key={platform}
          className="px-3 py-1 text-xs rounded-full border border-blue-500 text-blue-600 bg-blue-50"
        >
          {platform}
        </span>
      ))}
    </div>
  </div>
)}

        {/* Objective */}
        {apiResponse?.objective && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Objective
            </h3>
            <p className="text-sm text-gray-600">{apiResponse.objective}</p>
          </div>
        )}

        {/* Target Audience */}
        {(apiResponse?.age_min || apiResponse?.gender || apiResponse?.locations) && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Target Audience
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
              {apiResponse?.age_min && apiResponse?.age_max && (
                <p>Age: {apiResponse.age_min}–{apiResponse.age_max}</p>
              )}
              {apiResponse?.gender && (
                <p>Gender: {apiResponse.gender}</p>
              )}
              {apiResponse?.locations && apiResponse.locations.length > 0 && (
                <p>Locations: {apiResponse.locations.join(', ')}</p>
              )}
            </div>
            {apiResponse?.interests && apiResponse.interests.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Interests:</p>
                <div className="flex gap-1 flex-wrap">
                  {apiResponse.interests.map((interest, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Budget & Schedule */}
        {(apiResponse?.daily_budget || apiResponse?.start_date) && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Budget & Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
              {apiResponse?.daily_budget && (
                <p>Daily Budget: {formatCurrency(apiResponse.daily_budget)}</p>
              )}
              {apiResponse?.start_date && (
                <p>Start Date: {formatDate(apiResponse.start_date)}</p>
              )}
              {apiResponse?.is_unlimited ? (
                <p className="text-green-600">✓ Running continuously</p>
              ) : apiResponse?.end_date ? (
                <p>End Date: {formatDate(apiResponse.end_date)}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Ad Creative */}
        {apiResponse && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Ad Creative
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              {apiResponse.ad_name && (
                <p><span className="font-medium">Ad Name:</span> {apiResponse.ad_name}</p>
              )}
              {apiResponse.ad_format && (
                <p><span className="font-medium">Format:</span> {apiResponse.ad_format === "image" ? "Image Ad" : "Video Ad"}</p>
              )}
              {apiResponse.headline && (
                <p><span className="font-medium">Headline:</span> {apiResponse.headline}</p>
              )}
              {apiResponse.primary_text && (
                <p><span className="font-medium">Primary Text:</span> {apiResponse.primary_text}</p>
              )}
              {apiResponse.description && (
                <p><span className="font-medium">Description:</span> {apiResponse.description}</p>
              )}
              {apiResponse.call_to_action && (
                <p><span className="font-medium">CTA:</span> {apiResponse.call_to_action}</p>
              )}
              {apiResponse.destination_url && (
                <p><span className="font-medium">Destination URL:</span> {apiResponse.destination_url}</p>
              )}
              {apiResponse.keywords && (
                <p><span className="font-medium">Keywords:</span> {apiResponse.keywords}</p>
              )}
              {apiResponse.file_name && (
                <p><span className="font-medium">Uploaded File:</span> {apiResponse.file_name}</p>
              )}
              {apiResponse.file_url && (
                <p><span className="font-medium">File URL:</span> {apiResponse.file_url}</p>
              )}
            </div>
          </div>
        )}

        {/* Pre-launch Checks */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-3">
            Pre-launch Checks
          </h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} /> All required fields completed
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} /> Ad accounts connected and verified
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} /> Budget allocation confirmed
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} /> Creative assets meet platform requirements
            </li>
          </ul>
        </div>

        {/* Before Publishing */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={18} />
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Before Publishing:</span> Once
              published, your campaign will go through platform review (usually
              24 hours) before going live. You can still edit or pause your
              campaign after publishing.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between mt-5">
          <Link
            to="/user-dashboard/campaigns-create/step-6"
            className="btn md:w-40 text-gray-700 border rounded-xl border-gray-700 hover:bg-gray-400 hover:text-white py-2 text-center"
          >
            Previous
          </Link>

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
        </div>
      </div>
    </div>
  );
};

export default Step7Review;