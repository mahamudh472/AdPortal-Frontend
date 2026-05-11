import AICampaignOptimization from "./AICampaignOptimization";
import AudienceAndPlacements from "./AudienceAndPlacements";
import CampaignsOverview from "./CampaignsOverview";
import CreativePerformance from "./CreativePerformance";
import PlatformSyncStatus from "./PlatformSyncStatus";


import { useEffect, useState } from "react";
import axios from "../../../../../../src/lib/axios";
import { Link, useParams } from "react-router";

const CampaignsViewDetails = () => {
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Get org_id from localStorage (selectedOrganization)
    function getOrgIdFromLocalStorage() {
        try {
            const org = localStorage.getItem('selectedOrganization');
            if (!org) return null;
            const parsed = JSON.parse(org);
            return parsed.id || null;
        } catch {
            return null;
        }
    }
    const org_id = getOrgIdFromLocalStorage();
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (!id) return;
        if (!org_id) return;
        axios
            .get(`/main/campaign/${id}/?org_id=${org_id}`)
            .then((res) => {
                setCampaign(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!campaign) return <div className="bg-white rounded-lg p-8 text-center max-w-md mx-auto my-10 shadow-sm border border-gray-200">
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
</div>;

    return (
        <div className="mt-5">
            <CampaignsOverview campaign={campaign} />
            <div className="mt-5 mb-5">
                <CreativePerformance campaign={campaign} />
            </div>
            <AudienceAndPlacements campaign={campaign} />
            <div className="mt-5">
                <AICampaignOptimization campaign={campaign} />
            </div>
            <PlatformSyncStatus syncStatuses={campaign.platform_sync_statuses} />
        </div>
    );
};

export default CampaignsViewDetails;