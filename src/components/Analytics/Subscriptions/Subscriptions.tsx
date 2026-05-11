
// import React, { useState } from "react";
// import { Check, X, FileText } from "lucide-react";
// import jsPDF from "jspdf";

// import type {
//   Plan,
//   BillingHistoryItem,
//   CardForm,
//   PlanKey,
// } from "@/types/subscription";



// const planOrder: PlanKey[] = ["starter", "growth", "scale"];



// const plans: Plan[] = [
//   {
//     key: "starter",
//     title: "Starter",
//     price: 79,
//     description:
//       "Launch quickly. Spend smarter. AI-powered ads without the complexity.",
//     features: [
//       "25 Campaigns per month",
//       "Connect Meta, Google, and TikTok",
//       "Manage campaigns on all platforms",
//       "Standard analytics dashboard",
//       "Performance-over-time charts",
//       "AI Copy Generator",
//       "Standard AI Smart Insights",
//       "Standard budget optimization suggestions",
//       "Upload creatives",
//       "Email support",
//     ],
//   },
//   {
//     key: "growth",
//     title: "Growth",
//     price: 199,
//     popular: true,
//     description:
//       "Scale campaigns with data-driven insights and collaboration tools.",
//     features: [
//       "Everything in Starter",
//       "100 campaigns per month",
//       "Full AI Smart Insights",
//       "AI budget optimization (daily recommendations)",
//       "AI creative fatigue detection",
//       "Audience expansion suggestions",
//       "Multi-platform spend & device performance analysis",
//       "Detailed platform-level reports",
//       "Team collaboration (up to 5 users)",
//       "Priority support",
//     ],
//   },
//   {
//     key: "scale",
//     title: "Scale",
//     price: 499,
//     description:
//       "Automate everything. Outsmart competitors. Grow profitably with AI",
//     features: [
//       "Everything in Growth",
//       "Unlimited campaigns per month",
//       "Full AI optimization engine (budget shifts + alerts)",
//       "Advanced audience & trend analysis",
//       "Custom analytics dashboards",
//       "Full reporting suite",
//       "Unlimited team collaboration",
//       "Agency workspace navigation",
//       "Premium onboarding",
//     ],
//   },
// ];

// const billingHistory: BillingHistoryItem[] = [
//   { id: 1, amount: 199, date: "2025-08-12", status: "Paid" },
//   { id: 2, amount: 199, date: "2025-09-12", status: "Paid" },
//   { id: 3, amount: 199, date: "2025-10-12", status: "Paid" },
// ];

// const BRAND_BLUE = "#2563EB";

// const SubscriptionBilling: React.FC = () => {
//   const [activePlan, setActivePlan] = useState<PlanKey>("growth");
//   const [openModal, setOpenModal] = useState(false);

//   const [cardForm, setCardForm] = useState<CardForm>({
//     cardNumber: "",
//     cardHolder: "",
//     expiry: "",
//     cvv: "",
//   });

//   console.log(setActivePlan);



//   const handleCardChange = (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     setCardForm({ ...cardForm, [e.target.name]: e.target.value });
//   };

//   const handleAddCard = () => {
//     console.log("New card added:", cardForm);

//     // Later: send to backend / Stripe
//     setOpenModal(false);

//     setCardForm({
//       cardNumber: "",
//       cardHolder: "",
//       expiry: "",
//       cvv: "",
//     });
//   };



//   const downloadInvoice = (item: BillingHistoryItem) => {
//     const doc = new jsPDF();

//     doc.setTextColor(BRAND_BLUE);
//     doc.setFontSize(22);
//     doc.text("AdPortal Invoice", 20, 25);

//     doc.setTextColor("#000");
//     doc.setFontSize(12);
//     doc.text(`Invoice ID: INV-${item.id}`, 20, 45);
//     doc.text(`Billing Date: ${item.date}`, 20, 55);
//     doc.text(`Status: ${item.status}`, 20, 65);

//     doc.text("Billed To:", 20, 85);
//     doc.text("AdPortal User", 20, 95);
//     doc.text("support@adportal.ai", 20, 105);

//     doc.text("Plan:", 20, 125);
//     doc.text(activePlan.toUpperCase(), 80, 125);

//     doc.text("Amount Paid:", 20, 145);
//     doc.text(`$${item.amount}`, 80, 145);

//     doc.setDrawColor(BRAND_BLUE);
//     doc.line(20, 160, 190, 160);

//     doc.setFontSize(10);
//     doc.text(
//       "Thank you for using AdPortal. This invoice confirms your subscription payment.",
//       20,
//       175
//     );

//     doc.save(`AdPortal_Invoice_${item.id}.pdf`);
//   };

//   return (
//     <div className="space-y-6 mt-5">
//       {/* HEADER */}
//       <div>
//         <h1 className="text-xl font-semibold text-slate-900">
//           Subscription & Billing
//         </h1>
//         <p className="text-sm text-slate-500">
//           Manage your subscription plan and billing information
//         </p>
//       </div>

//       {/* PLANS */}
//       <div>
//         <h2 className="font-semibold text-slate-900 mb-4">
//           Available Plans
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {plans.map((plan) => {
//             const activeIndex = planOrder.indexOf(activePlan);
//             const planIndex = planOrder.indexOf(plan.key);

//             const isCurrent = plan.key === activePlan;
//             const isIncluded = planIndex < activeIndex;
//             const isUpgrade = planIndex > activeIndex;

//             let buttonLabel = "Upgrade";
//             let buttonStyle =
//               "border text-slate-600 hover:bg-slate-50";

//             if (isCurrent) {
//               buttonLabel = "Current Plan";
//               buttonStyle =
//                 "bg-blue-600 text-white cursor-not-allowed";
//             } else if (isIncluded) {
//               buttonLabel = "Included";
//               buttonStyle =
//                 "bg-slate-100 text-slate-500 cursor-not-allowed";
//             }

//             return (
//               <div
//                 key={plan.key}
//                 className={`relative rounded-2xl border p-6 ${
//                   isCurrent
//                     ? "border-blue-600 shadow-lg scale-[1.02]"
//                     : "hover:border-slate-300"
//                 }`}
//               >
//                 {plan.popular && (
//                   <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-600">
//                     Most Popular
//                   </span>
//                 )}

//                 <h3 className="text-lg font-semibold">
//                   {plan.title}
//                 </h3>

//                 <p className="mt-2 text-sm text-slate-500">
//                   {plan.description}
//                 </p>

//                 <div className="mt-5 flex items-end gap-1">
//                   <span className="text-3xl font-semibold">
//                     ${plan.price}
//                   </span>
//                   <span className="text-sm text-slate-500">
//                     / month
//                   </span>
//                 </div>

//                 <ul className="mt-5 space-y-2 text-sm text-slate-600">
//                   {plan.features.map((f) => (
//                     <li key={f} className="flex gap-2">
//                       <Check
//                         size={16}
//                         className="text-blue-600 mt-0.5"
//                       />
//                       {f}
//                     </li>
//                   ))}
//                 </ul>

//                 <button
//                   disabled={!isUpgrade}
//                   onClick={() => isUpgrade && setOpenModal(true)}
//                   className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-medium ${buttonStyle}`}
//                 >
//                   {buttonLabel}
//                 </button>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* BILLING HISTORY */}
//       <div className="rounded-xl border bg-white">
//         <h2 className="px-6 py-4 font-semibold border-b">
//           Billing History
//         </h2>

//         {billingHistory.map((item) => (
//           <div
//             key={item.id}
//             className="flex items-center justify-between px-6 py-4 border-b last:border-b-0"
//           >
//             <div className="flex items-center gap-3">
//               <FileText size={18} />
//               <div>
//                 <p className="text-sm font-medium">
//                   ${item.amount}
//                 </p>
//                 <p className="text-xs text-slate-500">
//                   {item.date}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
//                 Paid
//               </span>
//               <button
//                 onClick={() => downloadInvoice(item)}
//                 className="rounded-md border px-3 py-1 text-xs"
//               >
//                 Download
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ADD CARD MODAL */}
//       {openModal && (
//         <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
//           <div className="w-full max-w-md rounded-xl bg-white p-6 relative">
//             <button
//               onClick={() => setOpenModal(false)}
//               className="absolute right-4 top-4 text-slate-400"
//             >
//               <X size={18} />
//             </button>

//             <h2 className="text-2xl font-bold mb-4">
//               Add New Card
//             </h2>

//             <div className="space-y-4">

//               <label className="font-semibold" htmlFor="">Card Number</label>
//               <input
//                 name="cardNumber"
//                 value={cardForm.cardNumber}
//                 onChange={handleCardChange}
//                 placeholder="1234 5678 9012 3456"
//                 className="w-full border rounded-lg px-3 py-2 text-sm"
//               />
//                  <label className="font-semibold" htmlFor="">Card Holder Name</label>
//               <input
//                 name="cardHolder"
//                 value={cardForm.cardHolder}
//                 onChange={handleCardChange}
//                 placeholder="Card Holder Name"
//                 className="w-full border rounded-lg px-3 py-2 text-sm"
//               />
//                 <label className="font-semibold" htmlFor="">Expiry Date</label>
//               <div className="flex gap-4">
//                 <input
//                   name="expiry"
//                   value={cardForm.expiry}
//                   onChange={handleCardChange}
//                   placeholder="MM/YY"
//                   className="w-full border rounded-lg px-3 py-2 text-sm"
//                 />

          
               
//                 <input
//                   name="cvv"
//                   value={cardForm.cvv}
//                   onChange={handleCardChange}
//                   placeholder="CVV"
//                   className="w-full border rounded-lg px-3 py-2 text-sm"
//                 />
//               </div>



//               <div className="flex gap-4 pt-2">
//                 <button
//                   onClick={() => setOpenModal(false)}
//                   className="w-full border rounded-lg py-2 text-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAddCard}
//                   className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm"
//                 >
//                   Add Card
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SubscriptionBilling;














import React, { useState, useEffect } from "react";
import { Check, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
import type {
  Plan,
  BillingHistoryItem,
  PlanKey,
  ApiPlan,
  ApiFeature
} from "@/types/subscription";

const planOrder: PlanKey[] = ["starter", "growth", "scale"];

type RawBillingHistoryItem = {
  id?: number;
  amount?: number;
  date?: string;
  status?: string;
  invoice_file?: string;
};

const getOrgId = (): string | null => {
  const selectedOrg = localStorage.getItem("selectedOrganization");
  if (selectedOrg) {
    try {
      const parsed = JSON.parse(selectedOrg);
      if (parsed?.id) return parsed.id;
    } catch (error) {
      console.error("Error parsing organization:", error);
    }
  }
  return null;
};

const SubscriptionBilling: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<PlanKey | "">("");
  const [subscriptionInfo, setSubscriptionInfo] = useState<string | null>(null);
  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    const org_id = getOrgId();
    if (!org_id) return;
    try {
      const response = await api.get(`/finance/get-current-plan/?org_id=${org_id}`);
      if (response.data && response.data.plan_name) {
        setActivePlan(response.data.plan_name);
      }
      if (response.data && response.data.info) {
        setSubscriptionInfo(response.data.info);
      }
    } catch (error) {
      const axErr = error as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 404 && axErr?.response?.data?.error === "No active subscription found.") {
        setActivePlan("");
      } else {
        // Optionally show a toast or handle other errors
        console.error("Error fetching current plan:", error);
      }
    }
    // Catch-all to prevent unhandled promise rejection
    return Promise.resolve();
  };
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<{ planId: number; planKey: PlanKey } | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchBillingHistory();
  }, []);

  const fetchPlans = async (): Promise<void> => {
    setLoadingPlans(true);
    try {
      const response = await api.get("/finance/get-plans");
      const apiPlans: ApiPlan[] = response.data;
      
      const transformedPlans: Plan[] = apiPlans.map(plan => {
        const featuresArray = Array.isArray(plan.features) 
          ? plan.features.map((feature: ApiFeature) => feature.value)
          : [];

        return {
          key: plan.name as PlanKey,
          title: plan.name.charAt(0).toUpperCase() + plan.name.slice(1),
          price: parseFloat(plan.price),
          description: plan.description,
          popular: plan.name === "growth",
          features: featuresArray,
          id: plan.id // Store the API id
        };
      });

      setPlans(transformedPlans);
    } catch (error: unknown) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load subscription plans");
      // Fallback to static plans if API fails
      setPlans([
        {
          key: "starter",
          title: "Starter",
          price: 79,
          description: "Launch quickly. Spend smarter. AI-powered ads without the complexity.",
          features: ["25 Campaigns per month", "Connect Meta, Google, and TikTok"],
          id: 1
        },
        {
          key: "growth",
          title: "Growth",
          price: 199,
          popular: true,
          description: "Scale campaigns with data-driven insights and collaboration tools.",
          features: ["Everything in Starter", "100 campaigns per month"],
          id: 2
        },
        {
          key: "scale",
          title: "Scale",
          price: 499,
          description: "Automate everything. Outsmart competitors. Grow profitably with AI",
          features: ["Everything in Growth", "Unlimited campaigns per month"],
          id: 3
        },
      ]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchBillingHistory = async (): Promise<void> => {
    const org_id = getOrgId();
    if (!org_id) {
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      const response = await api.get(`/finance/billing-history?org_id=${org_id}`);
      
      let historyData: RawBillingHistoryItem[] = [];
      
      if (Array.isArray(response.data)) {
        historyData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        historyData = response.data.results;
      }
      


      
      const transformedHistory: BillingHistoryItem[] = historyData.map((item) => ({
        id: item.id || 0,
        amount: item.amount || 0,
        date: item.date || "",
        status: item.status || "Unknown",
        invoice_file: item.invoice_file || ""
      }));

      setBillingHistory(transformedHistory);
    } catch (error: unknown) {
      console.error("Error fetching billing history:", error);
      setBillingHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBuyPlan = (planId: number, planKey: PlanKey): void => {
    setProcessingPayment({ planId, planKey });
    navigate(`/user-dashboard/payment?plan_id=${planId}&plan_key=${planKey}`, {
      state: { planId, planKey },
    });
  };

  const downloadInvoice = async (item: BillingHistoryItem): Promise<void> => {
    if (!item.invoice_file) {
      toast.error("Invoice file not available");
      return;
    }

    try {
      const response = await fetch(item.invoice_file);
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Invoice_${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  return (
    <div className="space-y-6 mt-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Subscription & Billing
        </h1>
        <p className="text-sm text-slate-500">
          Manage your subscription plan and billing information
        </p>
      </div>

      {subscriptionInfo && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
          <div className="mt-0.5">
            <Info size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {subscriptionInfo}
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-900 mb-4">
          Available Plans
        </h2>

        {loadingPlans ? (
          <div className="flex justify-center items-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const activeIndex = planOrder.indexOf(activePlan as PlanKey);
              const planIndex = planOrder.indexOf(plan.key);


              // If no plan is active (new account), show all as 'Buy Plan' and none as active
              const noActivePlan = !activePlan || !planOrder.includes(activePlan);
              const isCurrent = !noActivePlan && plan.key === activePlan;
              const isLowerTier = !noActivePlan && planIndex < activeIndex;
              const isHigherTier = !noActivePlan && planIndex > activeIndex;
              const isLoading = processingPayment?.planId === plan.id;

              let buttonLabel = "";
              let buttonStyle = "border border-slate-300 text-slate-600 hover:bg-slate-50";
              let buttonDisabled = false;

              if (noActivePlan) {
                buttonLabel = "Buy Plan";
                buttonDisabled = false;
                buttonStyle = "border border-slate-300 text-slate-600 hover:bg-slate-50";
              } else if (isCurrent) {
                buttonLabel = "Current Plan";
                buttonStyle = "bg-blue-600 text-white cursor-not-allowed";
                buttonDisabled = true;
              } else if (isHigherTier) {
                buttonLabel = `Upgrade to ${plan.title}`;
              } else if (isLowerTier) {
                buttonLabel = `Downgrade to ${plan.title}`;
              } else {
                buttonLabel = "Contact Sales";
                buttonStyle = "bg-slate-100 text-slate-500 cursor-not-allowed";
                buttonDisabled = true;
              }

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl border p-6 ${
                    !noActivePlan && isCurrent
                      ? "border-blue-600 shadow-lg scale-[1.02]"
                      : (!noActivePlan ? "hover:border-slate-300" : "")
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-600">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold">
                    {plan.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {plan.description}
                  </p>

                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-3xl font-semibold">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-slate-500">
                      / month
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    {plan.features.map((f, index) => (
                      <li key={index} className="flex gap-2">
                        <Check
                          size={16}
                          className="text-blue-600 mt-0.5"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && !buttonDisabled && handleBuyPlan(plan.id, plan.key)}
                    disabled={buttonDisabled || isLoading}
                    className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${buttonStyle}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {buttonLabel}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white">
        <h2 className="px-6 py-4 font-semibold border-b">
          Billing History
        </h2>

        {loadingHistory ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">Loading billing history...</p>
          </div>
        ) : billingHistory.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No billing history found</p>
          </div>
        ) : (
          billingHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="text-blue-600" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    ${item.amount}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-1 text-xs ${
                  item.status === "Paid" 
                    ? "bg-green-100 text-green-700"
                    : item.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {item.status}
                </span>
                <button
                  onClick={() => downloadInvoice(item)}
                  disabled={!item.invoice_file}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SubscriptionBilling;