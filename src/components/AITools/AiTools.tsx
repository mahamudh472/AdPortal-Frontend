import React, { useState, useEffect } from "react";
import { Sparkles, Wand2, RefreshCcw, Copy } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";

type CopyType = "headlines" | "primary" | "descriptions" | "ctas";

type GeneratedItem = {
  id: number;
  text: string;
};

type Optimizationimpact = "High impact" | "Medium impact";

type OptimizationItem = {
  title: string;
  description: string;
  impact: Optimizationimpact;
};

const OPTIMIZATION_DATA: OptimizationItem[] = [
  {
    title: "Budget Reallocation Suggestion",
    description:
      "Google Ads is performing 23% better than Meta in terms of ROAS. Consider reallocating $15/day from Meta to Google Ads.",
    impact: "High impact",
  },
  {
    title: "New Target Audience Proposal",
    description:
      "Targeting a younger demographic on Instagram has shown a 35% increase in engagement. Recommend allocating an additional $10/day.",
    impact: "Medium impact",
  },
  {
    title: "Creative Content Enhancement",
    description:
      "Video content on social media results in 50% higher shares. Consider investing an extra $20/day for video production.",
    impact: "High impact",
  },
  {
    title: "Cross-Promotion Strategy",
    description:
      "Collaborating with influencers has led to a 40% boost in brand awareness. Allocate $5/day for influencer partnerships.",
    impact: "Medium impact",
  },
];

// suppress unused-variable warning — kept for future optimization panel
void OPTIMIZATION_DATA;

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

const AiTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"copy" | "optimization">(() => {
    // Check hash on initial load
    if (window.location.hash === "#optimization") {
      return "optimization";
    }
    return "copy";
  });
  
  const [generated, setGenerated] = useState(false);
  const [copyType, setCopyType] = useState<CopyType>("headlines");
  const [generatedCopies, setGeneratedCopies] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Controlled form states
  const [product, setProduct] = useState("AdPortal");
  const [audience, setAudience] = useState("Ecommerce Businessman");
  const [benefits, setBenefits] = useState(
    "Ad run with AI for Google, Meta and Tiktok"
  );
  const [tone, setTone] = useState("Professional");

  // AI Insights state
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#optimization") {
        setActiveTab("optimization");
      } else if (window.location.hash === "#copy" || window.location.hash === "") {
        setActiveTab("copy");
      }
    };

    // Add event listener
    window.addEventListener("hashchange", handleHashChange);

    // Check hash on mount
    handleHashChange();

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Fetch insights when optimization tab is active
  useEffect(() => {
    if (activeTab !== "optimization") return;
    
    const org_id = getOrgId();
    if (!org_id) return;
    
    setInsightsLoading(true);
    api
      .get(`/main/ai-insights/?org_id=${org_id}`)
      .then((res) => {
        setInsights(res.data.results || []);
      })
      .catch((err) => {
        console.error("Error fetching insights:", err);
        setInsights([]);
      })
      .finally(() => setInsightsLoading(false));
  }, [activeTab]);

  // Copy to clipboard logic
  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Generate AI copy function
  const generateAICopy = async (isRegenerate: boolean = false) => {
    const org_id = getOrgId();
    if (!org_id) {
      toast.error("Please select an organization first");
      return;
    }

    if (!product.trim() || !audience.trim() || !benefits.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // Map UI copy_type to API copy_type
      const copyTypeMap: Record<CopyType, string> = {
        "headlines": "Headlines",
        "primary": "Primary Text",
        "descriptions": "Descriptions",
        "ctas": "CTAs"
      };

      const apiCopyType = copyTypeMap[copyType] || "Descriptions";

      const payload = {
        product: product.trim(),
        audience: audience.trim(),
        benefits: benefits.trim(),
        tone: tone.trim(),
        copy_type: apiCopyType
      };

      const response = await api.post(
        `/main/generate-ai-copy/?org_id=${org_id}`,
        payload
      );

      const generatedTexts = response.data.generated_copies || [];
      
      // Transform API response to GeneratedItem format
      const generatedItems: GeneratedItem[] = generatedTexts.map((text: string, index: number) => ({
        id: index + 1,
        text: text
      }));

      setGeneratedCopies(generatedItems);
      setGenerated(true);
      
      if (isRegenerate) {
        toast.success("Copy regenerated successfully!");
      } else {
        toast.success("AI copy generated successfully!");
      }

    } catch (error: any) {
      console.error("Error generating AI copy:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.detail) {
          toast.error(errorData.detail);
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          toast.error("Invalid request. Please check your inputs.");
        }
      } else if (error.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.message === "Network Error") {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to generate AI copy. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    generateAICopy(false);
  };

  const handleRegenerate = () => {
    generateAICopy(true);
  };

  const handleTabChange = (tab: "copy" | "optimization") => {
    // Update hash based on tab
    if (tab === "optimization") {
      window.location.hash = "optimization";
    } else {
      window.location.hash = "copy";
    }
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6 mt-5 ml-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">AI Tools</h1>
          <p className="text-sm text-slate-500">
            Generate compelling ad copy and optimize your campaigns with AI
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white p-2 border">
        <button
          onClick={() => handleTabChange("copy")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === "copy"
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500"
          }`}
        >
          <Wand2 size={16} /> AI Copy Generator
        </button>

        <button
          onClick={() => handleTabChange("optimization")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === "optimization"
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500"
          }`}
        >
          <Sparkles size={16} /> AI Optimization
        </button>
      </div>

      {/* AI Copy Generator */}
      {activeTab === "copy" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="rounded-xl border bg-white p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Generate Ad Copy</h2>

            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Product / Service"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Target Audience"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Key Benefits"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
              <option value="Friendly">Friendly</option>
              <option value="Formal">Formal</option>
              <option value="Informal">Informal</option>
            </select>

            {/* Copy Type */}
            <div className="flex gap-2 flex-wrap">
              {["headlines", "primary", "descriptions", "CTAs"].map((t) => (
                <button
                  key={t}
                  onClick={() => setCopyType(t as CopyType)}
                  className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${
                    copyType === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t === "primary" ? "Primary Text" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Copy
                </>
              )}
            </button>
          </div>

          {/* Generated Copy */}
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Generated Copy</h2>
              {generated && (
                <button 
                  onClick={handleRegenerate} 
                  disabled={loading}
                  className="flex cursor-pointer items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Regenerate
                </button>
              )}
            </div>

            {!generated ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <img
                  src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765832904/Icon_13_tqqkug.png"
                  alt="AI Copy Generator"
                  className="w-26 h-26"
                />
                <p className="text-sm mt-2 text-center">
                  Fill in the form and click "Generate Copy" to see AI-generated suggestions
                </p>
              </div>
            ) : generatedCopies.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <img
                  src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765832904/Icon_13_tqqkug.png"
                  alt="No results"
                  className="w-26 h-26"
                />
                <p className="text-sm mt-2 text-center">
                  No copy generated. Please try again.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedCopies.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-blue-200 bg-blue-50 p-3 hover:bg-blue-100 transition-colors"
                  >
                    <p className="text-sm text-slate-700">{item.text}</p>
                    <button
                      onClick={() => handleCopy(item.text)}
                      className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Copy size={12} /> Copy to clipboard
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Optimization */}
      {activeTab === "optimization" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">
            AI Campaign Optimization
          </h2>

          {insightsLoading ? (
            <div className="text-center text-slate-500 py-8">Loading insights...</div>
          ) : insights.length > 0 ? (
            insights.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-xl border border-slate-200 p-4 flex items-start justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {item.description}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full h-fit ml-4 ${
                    item.impact === "HIGH"
                      ? "bg-green-100 border border-green-500 text-green-700"
                      : item.impact === "MEDIUM"
                      ? "bg-yellow-100 border border-yellow-500 text-yellow-700"
                      : "bg-slate-100 border border-slate-300 text-slate-700"
                  }`}
                >
                  {item.impact}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No insights found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiTools;