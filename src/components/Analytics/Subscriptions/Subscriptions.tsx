import React, { useState, useEffect } from "react";
import {
  Check,
  FileText,
  Info,
  Rocket,
  TrendingUp,
  Crown,
  HelpCircle,
  CreditCard,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
import type {
  Plan,
  BillingHistoryItem,
  PlanKey,
  ApiPlan,
  ApiFeature,
} from "@/types/subscription";

interface FormattedBillingRecord {
  id: number | string;
  date: string;
  description: string;
  subPeriod: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  invoiceFile?: string;
}

const DEFAULT_MOCK_BILLING: FormattedBillingRecord[] = [
  {
    id: 1,
    date: "Apr 5, 2026",
    description: "Starter Plan - Monthly Subscription",
    subPeriod: "Apr 5 – May 5, 2026",
    amount: "$79.00",
    status: "Paid",
  },
  {
    id: 2,
    date: "Mar 5, 2026",
    description: "Starter Plan - Monthly Subscription",
    subPeriod: "Mar 5 – Apr 5, 2026",
    amount: "$79.00",
    status: "Paid",
  },
  {
    id: 3,
    date: "Feb 5, 2026",
    description: "Starter Plan - Monthly Subscription",
    subPeriod: "Feb 5 – Mar 5, 2026",
    amount: "$79.00",
    status: "Paid",
  },
  {
    id: 4,
    date: "Jan 5, 2026",
    description: "Starter Plan - Monthly Subscription",
    subPeriod: "Jan 5 – Feb 5, 2026",
    amount: "$79.00",
    status: "Paid",
  },
  {
    id: 5,
    date: "Dec 5, 2025",
    description: "Starter Plan - Monthly Subscription",
    subPeriod: "Dec 5 – Jan 5, 2026",
    amount: "$79.00",
    status: "Paid",
  },
];

const planOrder: PlanKey[] = ["starter", "growth", "scale"];

const STATIC_PLANS: Plan[] = [
  {
    key: "starter",
    title: "Starter",
    price: 79,
    description: "Launch quickly. Spend smarter. AI-powered ads without the complexity.",
    features: [
      "25 Campaigns per month",
      "Connect Meta, Google, and TikTok",
      "Manage campaigns on all platforms",
      "Standard analytics dashboard",
      "Performance-over-time charts",
      "AI Copy Generator",
      "Standard AI Smart Insights",
      "Standard budget optimization suggestions",
      "Upload creatives",
      "Email support",
    ],
    id: 1,
  },
  {
    key: "growth",
    title: "Growth",
    price: 199,
    popular: true,
    description: "Scale campaigns with data-driven insights and collaboration tools.",
    features: [
      "100 campaigns per month",
      "Everything in Starter",
      "Full AI Smart Insights",
      "AI budget optimization (daily recommendations)",
      "AI creative fatigue detection",
      "Audience expansion suggestions",
      "Multi-platform spend & device performance analysis",
      "Detailed platform-level reports",
      "Team collaboration (up to 5 users)",
      "Priority support",
    ],
    id: 2,
  },
  {
    key: "scale",
    title: "Scale",
    price: 499,
    description: "Automate everything. Outsmart competitors. Grow profitably with AI.",
    features: [
      "Unlimited campaigns per month",
      "Everything in Growth",
      "Full AI optimization engine (budget shifts + alerts)",
      "Advanced audience & trend analysis",
      "Custom analytics dashboards",
      "Full reporting suite",
      "Unlimited team collaboration",
      "Agency workspace navigation",
      "Premium onboarding",
    ],
    id: 3,
  },
];

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
  const [plans, setPlans] = useState<Plan[]>(STATIC_PLANS);
  const [activePlan, setActivePlan] = useState<PlanKey | "">("starter");
  const [subscriptionInfo, setSubscriptionInfo] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<FormattedBillingRecord[]>(DEFAULT_MOCK_BILLING);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<{ planId: number; planKey: PlanKey } | null>(null);

  useEffect(() => {
    fetchCurrentPlan();
    fetchPlans();
    fetchBillingHistory();
  }, []);

  const fetchCurrentPlan = async () => {
    const org_id = getOrgId();
    if (!org_id) return;
    try {
      const response = await api.get(`/finance/get-current-plan/?org_id=${org_id}`);
      if (response.data && response.data.plan_name) {
        const pName = response.data.plan_name.toLowerCase() as PlanKey;
        if (planOrder.includes(pName)) {
          setActivePlan(pName);
        }
      }
      if (response.data && response.data.info) {
        setSubscriptionInfo(response.data.info);
      }
    } catch (error: any) {
      console.error("Error fetching current plan:", error);
    }
  };

  const fetchPlans = async (): Promise<void> => {
    try {
      const response = await api.get("/finance/get-plans");
      const apiPlans: ApiPlan[] = response.data;

      if (Array.isArray(apiPlans) && apiPlans.length > 0) {
        const transformedPlans: Plan[] = apiPlans.map((plan) => {
          const featuresArray = Array.isArray(plan.features)
            ? plan.features.map((feature: ApiFeature) => feature.value)
            : [];

          return {
            key: plan.name.toLowerCase() as PlanKey,
            title: plan.name.charAt(0).toUpperCase() + plan.name.slice(1),
            price: parseFloat(plan.price),
            description: plan.description,
            popular: plan.name.toLowerCase() === "growth",
            features: featuresArray.length > 0 ? featuresArray : STATIC_PLANS.find((sp) => sp.key === plan.name.toLowerCase())?.features || [],
            id: plan.id,
          };
        });
        setPlans(transformedPlans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchBillingHistory = async (): Promise<void> => {
    const org_id = getOrgId();
    if (!org_id) return;

    try {
      const response = await api.get(`/finance/billing-history?org_id=${org_id}`);
      let historyData: any[] = [];

      if (Array.isArray(response.data)) {
        historyData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        historyData = response.data.results;
      }

      if (historyData.length > 0) {
        const transformed = historyData.map((item, idx) => ({
          id: item.id || idx + 1,
          date: item.date || "Apr 5, 2026",
          description: item.description || "Subscription Billing",
          subPeriod: item.period || "Current Month",
          amount: typeof item.amount === "number" ? `$${item.amount.toFixed(2)}` : `$${item.amount || "79.00"}`,
          status: (item.status === "Paid" || item.status === "Pending" ? item.status : "Paid") as "Paid" | "Pending",
          invoiceFile: item.invoice_file,
        }));
        setBillingHistory(transformed);
      }
    } catch (error) {
      console.error("Error fetching billing history:", error);
    }
  };

  const handleBuyPlan = (planId: number, planKey: PlanKey): void => {
    setProcessingPayment({ planId, planKey });
    navigate(`/user-dashboard/payment?plan_id=${planId}&plan_key=${planKey}`, {
      state: { planId, planKey },
    });
  };

  const downloadSingleInvoice = async (item: FormattedBillingRecord): Promise<void> => {
    if (!item.invoiceFile) {
      toast.success(`Downloading invoice for ${item.description} (${item.date})`);
      return;
    }

    try {
      const response = await fetch(item.invoiceFile);
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Invoice_${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Invoice downloaded successfully!");
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const downloadAllInvoices = () => {
    toast.success("Downloading all invoices as ZIP archive...");
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription & Billing</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your subscription plan and billing information
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info("Redirecting to Billing FAQs")}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Billing FAQ</span>
          </button>

          <button
            onClick={() => toast.info("Opening payment management portal")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Manage Payment</span>
          </button>
        </div>
      </div>

      {/* SUBSCRIPTION INFO ALERT */}
      {subscriptionInfo && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-blue-900 shadow-sm">
          <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{subscriptionInfo}</p>
        </div>
      )}

      {/* AVAILABLE PLANS SECTION */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const activeIndex = planOrder.indexOf(activePlan as PlanKey);
            const planIndex = planOrder.indexOf(plan.key);

            const isCurrent = activePlan === plan.key;
            const isHigherTier = activePlan !== "" && planIndex > activeIndex;
            const isLowerTier = activePlan !== "" && planIndex < activeIndex;
            const isLoading = processingPayment?.planId === plan.id;

            let buttonLabel = "";
            let buttonStyle = "border border-blue-300 text-blue-600 hover:bg-blue-50 font-bold text-xs py-2.5 rounded-xl shadow-sm w-full text-center cursor-pointer transition-all";
            let isCurrentButtonStyle = false;

            if (isCurrent) {
              buttonLabel = "Current Plan";
              buttonStyle = "bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md w-full text-center cursor-default";
              isCurrentButtonStyle = true;
            } else if (plan.key === "scale") {
              buttonLabel = "Upgrade to Scale";
              buttonStyle = "border border-purple-300 text-purple-600 hover:bg-purple-50 font-bold text-xs py-2.5 rounded-xl shadow-sm w-full text-center cursor-pointer transition-all";
            } else if (isHigherTier || activePlan === "") {
              buttonLabel = `Upgrade to ${plan.title}`;
            } else if (isLowerTier) {
              buttonLabel = `Downgrade to ${plan.title}`;
            } else {
              buttonLabel = "Select Plan";
            }

            return (
              <div
                key={plan.key}
                className={`rounded-2xl p-6 shadow-sm flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? "bg-blue-50/20 border-2 border-blue-500 shadow-md"
                    : "bg-white border border-slate-200 hover:shadow-md"
                }`}
              >
                {/* POPULAR BADGE */}
                {plan.popular && (
                  <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2.5 py-1 rounded-full absolute top-5 right-5">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  {/* ICON */}
                  <div
                    className={`p-3 rounded-2xl w-11 h-11 flex items-center justify-center shrink-0 ${
                      plan.key === "starter"
                        ? "bg-blue-50 text-blue-600"
                        : plan.key === "growth"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {plan.key === "starter" ? (
                      <Rocket className="w-5 h-5" />
                    ) : plan.key === "growth" ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <Crown className="w-5 h-5" />
                    )}
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* PRICE */}
                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/month</span>
                  </div>

                  {/* FEATURES LIST */}
                  <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="font-medium text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* BOTTOM BUTTON */}
                <div className="pt-6">
                  <button
                    disabled={isCurrentButtonStyle || isLoading}
                    onClick={() => !isCurrentButtonStyle && handleBuyPlan(plan.id, plan.key)}
                    className={`${buttonStyle} ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {isLoading ? "Processing..." : buttonLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BILLING HISTORY SECTION */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900">Billing History</h2>

          <button
            onClick={downloadAllInvoices}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download All Invoices</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-2.5 font-bold">Date</th>
                <th className="py-2.5 font-bold">Description</th>
                <th className="py-2.5 font-bold">Amount</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {billingHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* DATE WITH FILE ICON */}
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 whitespace-nowrap">
                        {item.date}
                      </span>
                    </div>
                  </td>

                  {/* DESCRIPTION & SUB-PERIOD */}
                  <td className="py-3.5 pr-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.description}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.subPeriod}</p>
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="py-3.5 pr-3 font-bold text-slate-900 whitespace-nowrap">
                    {item.amount}
                  </td>

                  {/* STATUS BADGE */}
                  <td className="py-3.5 pr-3">
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block">
                      {item.status}
                    </span>
                  </td>

                  {/* INVOICE DOWNLOAD BUTTON */}
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => downloadSingleInvoice(item)}
                      className="border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-3 py-1 rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER / PAGINATION */}
        <div className="flex items-center justify-center border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1 rounded-xl cursor-pointer opacity-50">
              &lt; Previous
            </button>
            <span className="bg-blue-600 text-white font-bold text-xs w-6 h-6 rounded-lg flex items-center justify-center shadow-sm">
              1
            </span>
            <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1 rounded-xl cursor-pointer">
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBilling;