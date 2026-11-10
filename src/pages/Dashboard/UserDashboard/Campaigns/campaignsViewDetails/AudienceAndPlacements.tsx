// import React from "react";

// interface PlacementItem {
//   label: string;
//   value: string;
//   percent: number;
// }

// const placements: PlacementItem[] = [
//   {
//     label: "Meta - Feed",
//     value: "125K",
//     percent: 100,
//   },
//   {
//     label: "Meta - Stories",
//     value: "78K",
//     percent: 62,
//   },
//   {
//     label: "Google - Search",
//     value: "42K",
//     percent: 34,
//   },
// ];

// const AudienceAndPlacements: React.FC = () => {
//   return (
//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//       {/* ================= Audience Targeting ================= */}
//       <div className="rounded-xl border bg-white p-6">
//         <h2 className="mb-4 text-sm font-semibold text-slate-900">
//           Audience Targeting
//         </h2>

//         <div className="space-y-4 text-sm">
//           <div>
//             <p className="text-xs text-slate-500">Location</p>
//             <p className="font-medium text-slate-900">
//               United States, Canada, United Kingdom
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-slate-500">Age Range</p>
//             <p className="font-medium text-slate-900">25-44</p>
//           </div>

//           <div>
//             <p className="text-xs text-slate-500">Gender</p>
//             <p className="font-medium text-slate-900">All</p>
//           </div>

//           <div>
//             <p className="mb-2 text-xs text-slate-500">
//               Interests
//             </p>
//             <div className="flex flex-wrap gap-2">
//               {[
//                 "Shopping",
//                 "Fashion",
//                 "Online Shopping",
//                 "Retail",
//               ].map((interest) => (
//                 <span
//                   key={interest}
//                   className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
//                 >
//                   {interest}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ================= Placements ================= */}
//       <div className="rounded-xl border bg-white p-6">
//         <h2 className="mb-4 text-sm font-semibold text-slate-900">
//           Placements
//         </h2>

//         <div className="space-y-5">
//           {placements.map((item) => (
//             <div key={item.label}>
//               <div className="mb-1 flex items-center justify-between text-sm">
//                 <span className="text-slate-700">
//                   {item.label}
//                 </span>
//                 <span className="text-slate-500">
//                   {item.value}
//                 </span>
//               </div>

//               <div className="h-2 w-full rounded-full bg-slate-100">
//                 <div
//                   className="h-2 rounded-full bg-blue-600"
//                   style={{ width: `${item.percent}%` }}
//                 />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AudienceAndPlacements;







import React from "react";

type Campaign = {
  id: number;
  name: string;
  objective: string;
  platforms: string[];
  matrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    roas: number;
    cpc: number;
    cpm: number;
    cpa: number;
  };
  ads: any[];
  audience_targeting: {
    min_age: number;
    max_age: number;
    gender: string;
    locations: string[];
    keywords: string;
  };
  status: string;
  created_at: string;
  ai_insights: unknown[];
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  placements?: Placement[];
};

type Placement = {
  platform: string;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  percent: number;
};

type AudienceAndPlacementsProps = {
  campaign: Campaign;
};

const AudienceAndPlacements: React.FC<AudienceAndPlacementsProps> = ({ campaign }) => {
  const { audience_targeting, platforms } = campaign;
  // Spend share per platform from the backend. Before any data has synced, list the
  // connected platforms without a share so the card is still informative.
  const placements: Placement[] =
    campaign.placements && campaign.placements.length > 0
      ? campaign.placements
      : (platforms || []).map((platform) => ({
          platform,
          label: platform,
          spend: 0,
          impressions: 0,
          clicks: 0,
          percent: 0,
        }));
  const hasPlacementData = placements.some((p) => p.percent > 0);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ================= Audience Targeting ================= */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Audience Targeting
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Location</p>
            <p className="font-medium text-slate-900">
              {audience_targeting.locations && audience_targeting.locations.length > 0
                ? audience_targeting.locations.join(", ")
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Age Range</p>
            <p className="font-medium text-slate-900">
              {audience_targeting.min_age}-{audience_targeting.max_age}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Gender</p>
            <p className="font-medium text-slate-900">
              {audience_targeting.gender.charAt(0).toUpperCase() + audience_targeting.gender.slice(1)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {audience_targeting.keywords
                ? audience_targeting.keywords.split(",").filter(Boolean).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                    >
                      {interest}
                    </span>
                  ))
                : <span className="text-slate-400">N/A</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ================= Placements ================= */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Placements
        </h2>

        <div className="space-y-5">
          {placements.length > 0 ? (
            placements.map((item) => (
              <div key={item.platform}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-500">
                    {hasPlacementData
                      ? `${item.percent}% · $${item.spend.toLocaleString()}`
                      : "No data yet"}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full mt-10 flex items-center justify-center">
  <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-md p-6 text-center">
    <h3 className="text-lg font-semibold text-slate-800">
      No Placements Found
    </h3>
    <p className="mt-2 text-sm text-slate-500">
      There are no placements available right now.
    </p>

    
  </div>
</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudienceAndPlacements;










