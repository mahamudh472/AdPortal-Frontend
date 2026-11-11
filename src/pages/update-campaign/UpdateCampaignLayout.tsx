import React, { Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import UpdateCampaignProgressBar from "./UpdateCampaignProgressBar";

const TOTAL_STEPS = 7;

const UpdateCampaignLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const match = location.pathname.match(/step-(\d+)/);
  const currentStep = match ? Number(match[1]) : 1;

  
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-slate-50 flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <Button
          variant="ghost"
          className="mb-2 px-0 text-slate-500 hover:text-slate-700"
          onClick={goBack}
        >
          ← Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Update Campaign
            </h1>
            <p className="text-sm text-slate-500">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </div>

          <span className="text-sm font-medium text-slate-600">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-6">
        <UpdateCampaignProgressBar currentStep={currentStep} />
      </div>

      
      <div className="flex-1 px-6 py-8">
        <Suspense fallback={<div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading…</div>}><Outlet /></Suspense>
      </div>

   
      <div className="border-t bg-white px-6 py-4">
        <div className="text-center text-sm text-slate-500">
          Step {currentStep} of {TOTAL_STEPS}
        </div>
      </div>
    </div>
  );
};

export default UpdateCampaignLayout;