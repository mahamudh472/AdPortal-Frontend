import React, { useState, useEffect } from "react";
import Icon from "../../assets/Icon.svg";
import { Link, useNavigate, useParams } from "react-router";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAudienceReach } from "@/lib/useAudienceReach";

type GenderType = "all" | "male" | "female";

const Step4Audience: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  
  const campaignId = id || localStorage.getItem("campaignId");

  // Local state
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [gender, setGender] = useState<GenderType>("all");
  const [location, setLocation] = useState<string>("");
  const [interests, setInterests] = useState<string>("");
  const [campaignData, setCampaignData] = useState<any>(null);

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

  // ক্যাম্পেইন ডাটা ফেচ করার ফাংশন
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
      const response = await api.get(`/main/campaign/${campaignId}/?org_id=${org_id}`);
      console.log("📥 Campaign data:", response.data);
      
      setCampaignData(response.data);
      
      // audience_targeting থেকে ডাটা নেওয়া
      const audience = response.data.audience_targeting || {};
      
      // Age values
      if (audience.min_age !== undefined && audience.min_age !== null) {
        setMinAge(audience.min_age.toString());
      }
      
      if (audience.max_age !== undefined && audience.max_age !== null) {
        setMaxAge(audience.max_age.toString());
      }
      
      // Gender
      if (audience.gender && ["all", "male", "female"].includes(audience.gender)) {
        setGender(audience.gender as GenderType);
      }
      
      // Locations
      if (audience.locations && audience.locations.length > 0) {
        setLocation(audience.locations[0]);
      }
      
      // Keywords
      if (audience.keywords) {
        setInterests(audience.keywords);
      }
      
      console.log("Loaded audience data:", {
        minAge: audience.min_age,
        maxAge: audience.max_age,
        gender: audience.gender,
        location: audience.locations?.[0],
        keywords: audience.keywords
      });
      
    } catch (err: any) {
      console.error("Error fetching campaign:", err);
      setError(err.response?.data?.message || "Failed to fetch campaign data");
    } finally {
      setFetchLoading(false);
    }
  };

  // কম্পোনেন্ট mount হওয়ার সময় ডাটা ফেচ করা
  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  // Estimated reach comes from the backend (debounced on every targeting change)
  const estimatedReach = useAudienceReach({ minAge, maxAge, gender, location, interests });

  // Submit to API
  const handleSubmit = async () => {
    if (!campaignId) {
      setError("Campaign ID not found. Please go back to Step 1.");
      return;
    }

    if (!minAge || !maxAge || !location || !interests) {
      setError("All fields are required. Please fill in all fields.");
      toast.error("All fields are required. Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const org_id = getOrgId();
      if (!org_id) {
        setError("No organization selected");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        campaign_id: parseInt(campaignId),
        min_age: parseInt(minAge) || 0,
        max_age: parseInt(maxAge) || 0,
        gender: gender,
        locations: location ? [location] : [],
        keywords: interests
      };

      console.log("📤 Updating audience data with POST:", {
        url: `/main/update-ad/?org_id=${org_id}`,
        data: requestData
      });

      const response = await api.post(`/main/update-ad/?org_id=${org_id}`, requestData);
      console.log("✅ Audience updated:", response.data);

      navigate(`/user-dashboard/campaigns-update/${campaignId}/update-step-5`);

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save audience data");
      toast.error(err.response?.data?.message || "Failed to save audience data");
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Update Target Audience</h2>
          <p className="text-sm text-gray-500">Loading your audience data...</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading audience data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Update Target Audience</h2>
        <p className="text-sm text-gray-500">
          Define who you want to reach with your campaign
        </p>
        {campaignId && campaignData && (
          <p className="text-xs text-gray-400 mt-1">
            Campaign ID: {campaignData.id} | Status: {campaignData.status}
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Age Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Minimum Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
            className={`w-full rounded-lg border ${!minAge ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="18"
            min="13"
            max="100"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Maximum Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
            className={`w-full rounded-lg border ${!maxAge ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="65"
            min="13"
            max="100"
          />
        </div>
      </div>

      {/* Gender + Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Gender 
          </label>
          <div className="flex gap-2">
            {(["all", "male", "female"] as GenderType[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium border transition
                  ${
                    gender === g
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                {g === "all" ? "All Genders" : 
                 g === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Locations <span className="text-red-500">*</span>
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full rounded-lg border ${!location ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select Location</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="India">India</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
          </select>
        </div>
      </div>

      {/* Interests */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Interests & Behaviors <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g., Happy, Sad, Crazy, Technology, Sports"
          className={`w-full rounded-lg border ${!interests ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <p className="text-xs text-gray-400 mt-1">
          Use commas to separate multiple interests
        </p>
      </div>

      {/* API Request Preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">
          🔄 Will Update Campaign #{campaignId} with (POST Request):
        </p>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify({
            campaign_id: parseInt(campaignId || "0"),
            min_age: parseInt(minAge) || 0,
            max_age: parseInt(maxAge) || 0,
            gender: gender,
            locations: location ? [location] : [],
            keywords: interests
          }, null, 2)}
        </pre>
        <p className="text-xs text-blue-600 mt-2">
          ✓ POST Request to: /main/update-ad/?org_id={getOrgId()}
        </p>
      </div>

      {/* Estimated Reach */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500">Estimated Daily Reach</p>
            <p className="text-lg font-semibold text-gray-900">
              {estimatedReach.min} - {estimatedReach.max}
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-300 shadow-md">
            <img src={Icon} alt="icon" className="w-8 h-8" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${estimatedReach.progress}%` }}
          />
        </div>

        <p className="text-xs text-gray-500">
          {estimatedReach.loading ? "Updating estimate…" : "Estimate based on your targeting. Actual reach may vary."}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-5">
        <Link
          to={`/user-dashboard/campaigns-update/${campaignId}/update-step-3`}
          className="btn md:w-40 text-gray-700 border rounded-xl border-gray-700 hover:bg-gray-400 hover:text-white"
        >
          Previous
        </Link>

        <button
          onClick={handleSubmit}
          disabled={loading || !minAge || !maxAge || !location || !interests || !campaignId}
          className="btn md:w-40 text-white bg-blue-600 hover:bg-blue-700 rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update & Continue"}
        </button>
      </div>
    </div>
  );
};

export default Step4Audience;