import React from "react";
import UpdateStep7Review from "../update-campaign/UpdateStep7Review";

/**
 * Final step of the create flow. It reviews the real campaign saved on the backend
 * (same view as the update flow) and publishes it through the API.
 */
const Step7Review: React.FC = () => (
  <UpdateStep7Review
    campaignId={localStorage.getItem("campaignId") ?? undefined}
    previousPath="/user-dashboard/campaigns-create/step-6"
  />
);

export default Step7Review;
