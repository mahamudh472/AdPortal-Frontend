import api from "@/lib/axios";
import { useState } from "react";
import { useNavigate } from "react-router";

const Step1CampaignName: React.FC = () => {
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName.trim()) {
      setError("Campaign name is required");
      return;
    }

    const org_id = getOrgId();
    if (!org_id) {
      setError("No organization selected");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/main/create-ad/?org_id=${org_id}`, {
        campaign_name: campaignName
      });

      console.log("Success:", response.data);

      // Handle both campaign_id and id from backend
      const id = response.data.campaign_id || response.data.id;
      const status = response.data.status || "DRAFT";
      const name = response.data.campaign_name || response.data.name || campaignName;

      if (id) {
        localStorage.setItem("campaignId", id.toString());
        localStorage.setItem("campaignStatus", status);
        localStorage.setItem("campaignName", name);
        navigate("/user-dashboard/campaigns-create/step-2");
      } else {
        console.error("No campaign ID returned from backend:", response.data);
        setError("Failed to create campaign: No ID returned");
      }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Add Campaign Name
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            What's your main name of this campaign?
          </p>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              placeholder="Transform Your Business Today"
              className={`w-full border ${
                error ? "border-red-500" : "border-gray-300"
              } rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              value={campaignName}
              onChange={(e) => {
                setCampaignName(e.target.value);
                setError("");
              }}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn md:w-40 mt-5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step1CampaignName;