import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type FaqCategory = "Plans & Upgrades" | "Payments" | "Invoices" | "Cancellation & Refunds";

interface BillingFaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

interface CategoryMeta {
  name: FaqCategory;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: CategoryMeta[] = [
  { name: "Plans & Upgrades", icon: CreditCard },
  { name: "Payments", icon: ShieldCheck },
  { name: "Invoices", icon: FileText },
  { name: "Cancellation & Refunds", icon: RefreshCw },
];

const billingFaqs: BillingFaqItem[] = [
  {
    id: "change-plan",
    category: "Plans & Upgrades",
    question: "How do I change my subscription plan?",
    answer:
      "Go to Subscription & Billing, choose the plan you want, and complete the payment flow. Upgrades take effect immediately, while downgrades are applied at the start of your next billing cycle.",
  },
  {
    id: "upgrade-proration",
    category: "Plans & Upgrades",
    question: "Will I be charged again if I upgrade mid-cycle?",
    answer:
      "If you upgrade mid-cycle, you are charged a prorated amount for the remainder of the current billing period. The unused portion of your previous plan is credited automatically, so you only pay the difference.",
  },
  {
    id: "plan-limits",
    category: "Plans & Upgrades",
    question: "What happens if I reach my plan limits?",
    answer:
      "Your campaigns keep running, but features that exceed your plan limits become unavailable until you upgrade or the next billing cycle starts. We notify you by email before you reach the limit.",
  },
  {
    id: "payment-methods",
    category: "Payments",
    question: "Which payment methods do you accept?",
    answer:
      "We accept all major debit and credit cards, including Visa, Mastercard, and American Express. Payments are processed securely through Stripe; we never store your full card details.",
  },
  {
    id: "failed-payment",
    category: "Payments",
    question: "What should I do if my payment fails?",
    answer:
      "First check that your card details and billing address are correct. If the card is declined, try another card or contact your bank. You can retry a failed payment from the billing history section at any time.",
  },
  {
    id: "billing-date",
    category: "Payments",
    question: "When will I be charged each month?",
    answer:
      "Your subscription renews automatically on the same date each month as your original signup. If that date does not exist in a given month, the charge happens on the last day of the month.",
  },
  {
    id: "invoices",
    category: "Invoices",
    question: "Where can I find my invoices?",
    answer:
      "Every successful payment appears in the Billing History table on the Subscription & Billing page. Use the Download button next to a payment to get a single invoice, or Download All Invoices to get your full history as a ZIP file.",
  },
  {
    id: "invoice-details",
    category: "Invoices",
    question: "Can I change the details shown on my invoices?",
    answer:
      "Invoices use the billing details saved for your organization. Update your business information in Settings before your next payment and the new details will appear on future invoices. Already-issued invoices cannot be edited.",
  },
  {
    id: "receipts",
    category: "Invoices",
    question: "Do you send receipts by email?",
    answer:
      "Yes. A receipt is emailed to your billing contact after every successful payment. If you are not receiving them, check your spam folder or confirm that the billing email in Settings is correct.",
  },
  {
    id: "cancel",
    category: "Cancellation & Refunds",
    question: "How do I cancel my subscription?",
    answer:
      "Open Subscription & Billing and choose a downgrade to the lowest available plan, or contact support to cancel. Your paid features remain active until the end of the current billing period.",
  },
  {
    id: "refunds",
    category: "Cancellation & Refunds",
    question: "Are payments refundable?",
    answer:
      "Subscription payments are generally non-refundable. If you believe you were charged incorrectly, contact support within 14 days of the charge and we will review your case.",
  },
  {
    id: "cancel-refund",
    category: "Cancellation & Refunds",
    question: "Will I get a refund if I cancel early?",
    answer:
      "Cancelling stops future renewals but does not refund the current period. You keep access to your plan until the period ends, and no further charges are made after that.",
  },
];

const BillingFAQ: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "All">("All");
  const [openId, setOpenId] = useState<string | null>(billingFaqs[0].id);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return billingFaqs.filter((faq) => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const matchesQuery =
        query === "" ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, search]);

  const groupedFaqs = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          faqs: filteredFaqs.filter((faq) => faq.category === category.name),
        }))
        .filter((group) => group.faqs.length > 0),
    [filteredFaqs]
  );

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/user-dashboard/subscriptions")}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Subscription &amp; Billing</span>
          </button>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Billing FAQ
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Answers to the most common questions about plans, payments, and invoices
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search billing questions..."
            className="w-full border border-slate-200 bg-slate-50/70 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory("All")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              activeCategory === "All"
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.name;

            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <Icon className="w-3 h-3" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ GROUPS */}
      <div className="max-w-4xl space-y-6">
        {groupedFaqs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900">No matching questions</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Try a different search term or choose another category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="mt-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all"
            >
              Reset filters
            </button>
          </div>
        )}

        {groupedFaqs.map((group) => {
          const Icon = group.icon;

          return (
            <div key={group.name} className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {group.name}
              </h2>

              <div className="space-y-2.5">
                {group.faqs.map((faq) => {
                  const isOpen = openId === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className={`rounded-2xl border bg-white shadow-sm transition-all ${
                        isOpen ? "border-blue-200" : "border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`${faq.id}-answer`}
                        className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-900">{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-blue-600" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div id={`${faq.id}-answer`} className="px-5 pb-4 -mt-1">
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* SUPPORT CTA */}
      <div className="max-w-4xl bg-gradient-to-br from-[#0A1B4D] to-[#123A8F] rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Still need help?</h2>
            <p className="text-xs text-blue-100 font-medium mt-1 leading-relaxed">
              Our support team can help with payments, invoices, and plan changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="mailto:support@adportal.com"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Support</span>
          </a>
          <Link
            to="/contact-us"
            className="bg-white hover:bg-blue-50 text-[#0A1B4D] font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BillingFAQ;
