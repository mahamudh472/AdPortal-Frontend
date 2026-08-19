import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Globe,
  Lightbulb,
  ChevronDown,
  FileText,
  Edit3,
  MousePointerClick,
  Info,
  Clock,
  RotateCw,
  Flame,
  AlertTriangle,
  Leaf,
  Scale,
  Rocket,
  MoreVertical,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";

type CopyType = "headlines" | "primary" | "descriptions" | "ctas";

interface GeneratedResultItem {
  id: string;
  text: string;
  type: CopyType;
  score?: "High Score" | "Good Score";
  selected?: boolean;
}

interface OptimizationInsight {
  id: string;
  impact: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  metrics: { label: string; value: string; isPositive?: boolean }[];
  campaignsCount: number;
  actionText: string;
  actionType: "apply" | "fix" | "generate" | "none" | "create";
}

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

const DEFAULT_RESULTS: GeneratedResultItem[] = [
  { id: "h1", text: "Run Smarter Ads with AI", type: "headlines", score: "High Score", selected: false },
  { id: "h2", text: "AI-Powered Ads. Better Results.", type: "headlines", score: "High Score", selected: false },
  { id: "h3", text: "Advertise Smarter. Not Harder.", type: "headlines", score: "Good Score", selected: false },
  { id: "h4", text: "Maximize ROAS with AI", type: "headlines", score: "High Score", selected: false },
  { id: "h5", text: "AI That Turns Clicks into Customers", type: "headlines", score: "Good Score", selected: false },
  { id: "h6", text: "Better Ads in Half the Time", type: "headlines", score: "Good Score", selected: false },
  {
    id: "p1",
    text: "AdPortal uses the power of AI to help you create, optimize, and scale ads across Google, Meta, and TikTok — all in one place. Get more clicks, lower costs, and better results.",
    type: "primary",
    selected: false,
  },
  {
    id: "p2",
    text: "Stop guessing. Start scaling. AdPortal's AI analyzes performance and creates high-converting ads that drive real results across every platform.",
    type: "primary",
    selected: false,
  },
  {
    id: "p3",
    text: "Create stunning ads, reach the right audience, and grow your business with AI-powered insights and automation.",
    type: "primary",
    selected: false,
  },
];

const DEFAULT_INSIGHTS: OptimizationInsight[] = [
  {
    id: "opt-1",
    impact: "HIGH",
    title: "Increase TikTok budget by +20%",
    description: "TikTok is delivering the highest ROAS. Increasing budget can drive more conversions.",
    metrics: [
      { label: "Conversions", value: "+18%", isPositive: true },
      { label: "CPA", value: "-10%", isPositive: true },
    ],
    campaignsCount: 2,
    actionText: "Apply Suggestion",
    actionType: "apply",
  },
  {
    id: "opt-2",
    impact: "MEDIUM",
    title: "Improve Google Ads CTR",
    description: "Your CTR is 23% below average. Improving ad copy can significantly boost results.",
    metrics: [
      { label: "CTR", value: "+12%", isPositive: true },
      { label: "CPC", value: "-8%", isPositive: true },
    ],
    campaignsCount: 1,
    actionText: "Fix with AI",
    actionType: "fix",
  },
  {
    id: "opt-3",
    impact: "LOW",
    title: "Expand audience interests",
    description: "Add related interests to reach a wider audience and increase potential conversions.",
    metrics: [
      { label: "Reach", value: "+8%", isPositive: true },
      { label: "Conversions", value: "+5%", isPositive: true },
    ],
    campaignsCount: 3,
    actionText: "Generate Suggestions",
    actionType: "generate",
  },
  {
    id: "opt-4",
    impact: "INFO",
    title: "Ad creative is performing well",
    description: "Your ad creative is outperforming 78% of similar campaigns.",
    metrics: [
      { label: "CTR", value: "3.4%", isPositive: true },
      { label: "CPC", value: "$0.45", isPositive: true },
    ],
    campaignsCount: 2,
    actionText: "No Action Needed",
    actionType: "none",
  },
  {
    id: "opt-5",
    impact: "LOW",
    title: "Test additional ad variations",
    description: "A/B testing more variations could improve conversion rate.",
    metrics: [
      { label: "Conversions", value: "+6%", isPositive: true },
      { label: "CPA", value: "-7%", isPositive: true },
    ],
    campaignsCount: 2,
    actionText: "Create Variations",
    actionType: "create",
  },
];

const AiTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"copy" | "optimization">(() => {
    if (window.location.hash === "#optimization") return "optimization";
    return "copy";
  });

  const [optSubTab, setOptSubTab] = useState<"insights" | "history">("insights");

  // Controlled Form State for AI Copy
  const [product, setProduct] = useState("AdPortal");
  const [niche, setNiche] = useState("Ecommerce Business");
  const [description, setDescription] = useState("Ad run with AI for Google, Meta and Tiktok");
  const [tone, setTone] = useState("Professional");
  const [platform, setPlatform] = useState<"all" | "google" | "meta" | "tiktok">("all");
  const [copyType, setCopyType] = useState<CopyType>("headlines");

  // Results & Copy UI State
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedResultItem[]>(DEFAULT_RESULTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMoreResults, setShowMoreResults] = useState(false);

  // AI Optimization Control Center States
  const [autoOptimization, setAutoOptimization] = useState(true);
  const [optimizationMode, setOptimizationMode] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [optimizationFrequency, setOptimizationFrequency] = useState("Daily Optimization");
  const [optimizingNow, setOptimizingNow] = useState(false);
  const [insightsList, setInsightsList] = useState<OptimizationInsight[]>(DEFAULT_INSIGHTS);
  const [insightsFilter, setInsightsFilter] = useState("all");

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#optimization") {
        setActiveTab("optimization");
      } else if (window.location.hash === "#copy" || window.location.hash === "") {
        setActiveTab("copy");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tab: "copy" | "optimization") => {
    window.location.hash = tab;
    setActiveTab(tab);
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setResults((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const handleSelectItem = (id: string) => {
    setResults((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleCopySelected = async () => {
    const selectedItems = results.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to copy.");
      return;
    }
    const combinedText = selectedItems.map((item) => item.text).join("\n\n");
    try {
      await navigator.clipboard.writeText(combinedText);
      toast.success(`Copied ${selectedItems.length} items to clipboard!`);
    } catch {
      toast.error("Failed to copy selected text.");
    }
  };

  const generateAICopy = async () => {
    const org_id = getOrgId();
    if (!org_id) {
      toast.error("Please select an organization first.");
      return;
    }
    if (!product.trim() || !description.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    try {
      const copyTypeMap: Record<CopyType, string> = {
        headlines: "Headlines",
        primary: "Primary Text",
        descriptions: "Descriptions",
        ctas: "CTAs",
      };

      const payload = {
        product: product.trim(),
        audience: niche.trim(),
        benefits: description.trim(),
        tone: tone.trim(),
        copy_type: copyTypeMap[copyType] || "Headlines",
      };

      const response = await api.post(`/main/generate-ai-copy/?org_id=${org_id}`, payload);
      const generatedTexts = response.data.generated_copies || [];

      if (generatedTexts.length > 0) {
        const newItems: GeneratedResultItem[] = generatedTexts.map((text: string, index: number) => ({
          id: `gen-${Date.now()}-${index}`,
          text: text,
          type: copyType,
          score: index % 2 === 0 ? "High Score" : "Good Score",
          selected: false,
        }));
        setResults((prev) => [...newItems, ...prev]);
        toast.success("AI copy generated successfully!");
      }
    } catch (err: any) {
      console.error("Error generating copy:", err);
      toast.error(err.response?.data?.message || "Failed to generate AI copy.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeNow = () => {
    setOptimizingNow(true);
    setTimeout(() => {
      setOptimizingNow(false);
      toast.success("AI Optimization check complete! Recommendations updated.");
    }, 1500);
  };

  const handleApplyInsight = (id: string, title: string) => {
    toast.success(`Action applied for "${title}"!`);
    setInsightsList((prev) => prev.filter((item) => item.id !== id));
  };

  const headlinesList = results.filter((item) => item.type === "headlines");
  const primaryList = results.filter((item) => item.type === "primary");
  const descriptionsList = results.filter((item) => item.type === "descriptions");
  const ctasList = results.filter((item) => item.type === "ctas");

  const isAllSelected = results.length > 0 && results.every((item) => item.selected);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-3 space-y-6">
      {/* TOP MAIN TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleTabChange("copy")}
          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
            activeTab === "copy"
              ? "bg-blue-50/80 border-blue-500 text-blue-600 shadow-sm"
              : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Wand2 className="w-4 h-4 text-blue-600" />
            <span>AI Copy Generator</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Create high-converting ad copy in seconds
          </p>
        </button>

        <button
          onClick={() => handleTabChange("optimization")}
          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
            activeTab === "optimization"
              ? "bg-blue-50/80 border-blue-500 text-blue-600 shadow-sm"
              : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>AI Optimization</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Get AI-powered campaign optimization tips
          </p>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI COPY GENERATOR                                  */}
      {/* ========================================================= */}
      {activeTab === "copy" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: FORM CARD */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Generate Ad Copy</h2>

              {/* Brand Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">Brand / Product Name</label>
                  <span className="text-slate-400 font-medium">{product.length}/100</span>
                </div>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. AdPortal"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Niche */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">Business / Niche</label>
                  <span className="text-slate-400 font-medium">{niche.length}/100</span>
                </div>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Ecommerce Business"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">Product or Service Description</label>
                  <span className="text-slate-400 font-medium">{description.length}/500</span>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product, service or promotion..."
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Tone */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Tone of Voice</label>
                <div className="relative">
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 appearance-none focus:outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Casual">Casual</option>
                    <option value="Creative">Creative</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Platform */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Platform</label>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {[
                    { key: "all", label: "All Platforms" },
                    { key: "google", label: "Google" },
                    { key: "meta", label: "Meta (Facebook & Instagram)" },
                    { key: "tiktok", label: "TikTok" },
                  ].map((p) => {
                    const isSelected = platform === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPlatform(p.key as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 border-blue-300 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Copy Type Selection Grid */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  What do you want to generate?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: "headlines", title: "Headlines", subtitle: "Short & catchy", icon: Sparkles },
                    { key: "primary", title: "Primary Text", subtitle: "Engaging ad copy", icon: FileText },
                    { key: "descriptions", title: "Descriptions", subtitle: "Product descriptions", icon: Edit3 },
                    { key: "ctas", title: "CTAs", subtitle: "Call to actions", icon: MousePointerClick },
                  ].map((t) => {
                    const isSelected = copyType === t.key;
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.key}
                        onClick={() => setCopyType(t.key as CopyType)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-500 text-blue-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{t.title}</div>
                          <div className="text-[10px] text-slate-400">{t.subtitle}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <button
                disabled={loading}
                onClick={generateAICopy}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Copy</span>
                  </>
                )}
              </button>

              {/* Pro Tips */}
              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5 text-xs space-y-2 mt-4">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pro Tips for better results</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                  <div>• Be specific about your product</div>
                  <div>• Mention unique benefits</div>
                  <div>• Include target audience</div>
                  <div>• Choose right brand tone</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: GENERATED RESULTS CARD */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Generated Results</h2>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {results.length} results
                    </span>
                  </div>

                  <button
                    onClick={handleCopySelected}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Selected</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 py-3 border-b border-slate-100">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="selectAll" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Select All
                  </label>
                </div>

                {/* Headlines Section */}
                {headlinesList.length > 0 && (
                  <div className="py-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                      <span>Headlines</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {headlinesList.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {headlinesList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-all text-xs"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => handleSelectItem(item.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer shrink-0"
                            />
                            <span className="font-semibold text-slate-800 truncate">{item.text}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.score && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  item.score === "High Score"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {item.score}
                              </span>
                            )}
                            <button
                              onClick={() => handleCopyText(item.id, item.text)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                              title="Copy"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Text Section */}
                {primaryList.length > 0 && (
                  <div className="py-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                      <span>Primary Text</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {primaryList.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {primaryList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-all text-xs"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => handleSelectItem(item.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-0.5 shrink-0"
                            />
                            <p className="text-slate-700 leading-relaxed font-medium">{item.text}</p>
                          </div>

                          <button
                            onClick={() => handleCopyText(item.id, item.text)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 mt-0.5"
                            title="Copy"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  onClick={() => setShowMoreResults(!showMoreResults)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <span>{showMoreResults ? "Show Less Results" : "View More Results"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreResults ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* FEATURE BANNER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Save Time</h4>
                <p className="text-[11px] text-slate-500 font-medium">Generate ad copy in seconds, not hours</p>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Boost Performance</h4>
                <p className="text-[11px] text-slate-500 font-medium">AI-optimized copy that converts better</p>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Multi-Platform</h4>
                <p className="text-[11px] text-slate-500 font-medium">Create content for all major ad platforms</p>
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Smart Suggestions</h4>
                <p className="text-[11px] text-slate-500 font-medium">AI learns and improves with every generation</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI OPTIMIZATION DASHBOARD                          */}
      {/* ========================================================= */}
      {activeTab === "optimization" && (
        <div className="space-y-6">
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Optimization</h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                AI-powered recommendations to improve performance and maximize your results.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 text-slate-600 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last Optimization: <span className="font-bold text-slate-800">2 hours ago</span></span>
              </div>

              <button
                disabled={optimizingNow}
                onClick={handleOptimizeNow}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 ${optimizingNow ? "animate-spin" : ""}`} />
                <span>{optimizingNow ? "Optimizing..." : "Optimize Now"}</span>
              </button>
            </div>
          </div>

          {/* SUB-TABS */}
          <div className="border-b border-slate-200 flex items-center gap-6">
            <button
              onClick={() => setOptSubTab("insights")}
              className={`pb-2.5 text-xs font-bold transition-all cursor-pointer ${
                optSubTab === "insights"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              AI Optimization
            </button>
            <button
              onClick={() => setOptSubTab("history")}
              className={`pb-2.5 text-xs font-bold transition-all cursor-pointer ${
                optSubTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Optimization History
            </button>
          </div>

          {optSubTab === "insights" ? (
            /* 2-COLUMN LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: AI INSIGHTS LIST (7 COLUMNS ON DESKTOP) */}
              <div className="lg:col-span-7 space-y-4">
                {/* LIST HEADER & FILTER */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">AI Insights</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {insightsList.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Filters:</span>
                    <div className="relative">
                      <select
                        value={insightsFilter}
                        onChange={(e) => setInsightsFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 pr-7 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                      >
                        <option value="all">All Campaigns</option>
                        <option value="high">High Impact Only</option>
                        <option value="medium">Medium Impact</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* INSIGHT CARDS */}
                <div className="space-y-3.5">
                  {insightsList.map((item) => {
                    const isHigh = item.impact === "HIGH";
                    const isMedium = item.impact === "MEDIUM";
                    const isLow = item.impact === "LOW";
                    const isInfo = item.impact === "INFO";

                    const borderColor = isHigh
                      ? "border-l-rose-500"
                      : isMedium
                      ? "border-l-amber-500"
                      : isInfo
                      ? "border-l-emerald-500"
                      : "border-l-blue-500";

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${borderColor} p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                      >
                        {/* LEFT CONTENT */}
                        <div className="flex items-start gap-3.5 flex-1">
                          {/* BADGE */}
                          <div className="shrink-0 mt-0.5">
                            {isHigh && (
                              <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                <Flame className="w-3 h-3 text-rose-500" />
                                HIGH
                              </span>
                            )}
                            {isMedium && (
                              <span className="bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                MEDIUM
                              </span>
                            )}
                            {isLow && (
                              <span className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                <Clock className="w-3 h-3 text-blue-500" />
                                LOW
                              </span>
                            )}
                            {isInfo && (
                              <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                INFO
                              </span>
                            )}
                          </div>

                          {/* TEXT & METRICS */}
                          <div className="space-y-1 flex-1">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              {item.description}
                            </p>

                            {/* METRICS PILLS */}
                            <div className="flex items-center gap-3 pt-1">
                              {item.metrics.map((m, idx) => (
                                <span key={idx} className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                                  <span>▲</span>
                                  <span>{m.value}</span>
                                  <span className="text-slate-400 font-medium ml-0.5">{m.label}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT ACTIONS */}
                        <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Campaigns: {item.campaignsCount}</span>
                            <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* ACTION BUTTON */}
                          {item.actionType === "apply" && (
                            <button
                              onClick={() => handleApplyInsight(item.id, item.title)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              {item.actionText}
                            </button>
                          )}
                          {(item.actionType === "fix" || item.actionType === "generate" || item.actionType === "create") && (
                            <button
                              onClick={() => handleApplyInsight(item.id, item.title)}
                              className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              {item.actionText}
                            </button>
                          )}
                          {item.actionType === "none" && (
                            <button className="bg-slate-100 text-slate-500 font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-default">
                              {item.actionText}
                            </button>
                          )}

                          <button
                            onClick={() => toast.info(`Viewing details for ${item.title}`)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BOTTOM LIST LOAD MORE */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400 font-medium">
                    Showing {insightsList.length} of 7 insights
                  </span>

                  <button
                    onClick={() => toast.info("All recommendations loaded.")}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-xl shadow-sm cursor-pointer transition-all"
                  >
                    Load More
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: AI CONTROL CENTER & SUMMARY (5 COLUMNS ON DESKTOP) */}
              <div className="lg:col-span-5 space-y-6">
                {/* CARD 1: AI CONTROL CENTER */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">AI Control Center</h2>
                  </div>

                  {/* Auto Optimization Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Auto Optimization</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Let AI automatically apply high-impact optimizations.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAutoOptimization(!autoOptimization);
                        toast.success(`Auto Optimization turned ${!autoOptimization ? "ON" : "OFF"}`);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoOptimization ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoOptimization ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Optimization Mode */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Optimization Mode</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Choose how aggressive AI should be with optimizations.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Conservative */}
                      <div
                        onClick={() => setOptimizationMode("conservative")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          optimizationMode === "conservative"
                            ? "bg-blue-50/80 border-2 border-blue-600 text-blue-600 font-bold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Leaf className="w-4 h-4 mb-1 text-emerald-500" />
                        <div className="text-xs font-bold">Conservative</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Low risk, gradual</div>
                      </div>

                      {/* Balanced */}
                      <div
                        onClick={() => setOptimizationMode("balanced")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          optimizationMode === "balanced"
                            ? "bg-blue-50/80 border-2 border-blue-600 text-blue-600 font-bold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Scale className="w-4 h-4 mb-1 text-blue-600" />
                        <div className="text-xs font-bold">Balanced</div>
                        <div className="text-[9px] text-blue-600 font-semibold mt-0.5">Recommended</div>
                      </div>

                      {/* Aggressive */}
                      <div
                        onClick={() => setOptimizationMode("aggressive")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          optimizationMode === "aggressive"
                            ? "bg-blue-50/80 border-2 border-blue-600 text-blue-600 font-bold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Rocket className="w-4 h-4 mb-1 text-indigo-600" />
                        <div className="text-xs font-bold">Aggressive</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Max performance</div>
                      </div>
                    </div>
                  </div>

                  {/* Optimization Frequency */}
                  <div className="space-y-1.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Optimization Frequency</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        How often should AI review and optimize your campaigns.
                      </p>
                    </div>

                    <div className="relative">
                      <select
                        value={optimizationFrequency}
                        onChange={(e) => setOptimizationFrequency(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Daily Optimization">Daily Optimization</option>
                        <option value="Weekly Optimization">Weekly Optimization</option>
                        <option value="Real-time Optimization">Real-time Optimization</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Potential Impact Box */}
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 text-center">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Potential Impact (Next 30 Days)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-base sm:text-lg font-extrabold text-emerald-600">+25%</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">Conversions</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-extrabold text-emerald-600">-15%</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">Cost per Result</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-extrabold text-emerald-600">+18%</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">ROAS</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: OPTIMIZATION SUMMARY */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Optimization Summary</h2>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Based on your active campaigns and performance data.
                    </p>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                      <div className="text-sm font-extrabold text-slate-900">12</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">Active insights</div>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                      <div className="text-sm font-extrabold text-slate-900">5</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">High Priority</div>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                      <div className="text-sm font-extrabold text-slate-900">3</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">Applied Today</div>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                      <div className="text-sm font-extrabold text-slate-900">$243</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">Est. Savings</div>
                    </div>
                  </div>

                  {/* Sparkle Banner */}
                  <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-900">AI is constantly analyzing your campaigns</h4>
                      <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed font-medium">
                        Our AI analyzes performance data 24/7 to find the best opportunities for improvement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* OPTIMIZATION HISTORY SUB-TAB */
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Optimization Activity</h2>
              <div className="space-y-3">
                {[
                  {
                    title: "Applied +20% Budget to TikTok Campaign #4",
                    time: "Today at 08:30 AM",
                    impact: "Conversions increased by +14%",
                    status: "Applied",
                  },
                  {
                    title: "Updated Ad Copy Headlines for Google Ads",
                    time: "Yesterday at 04:15 PM",
                    impact: "CTR improved by +9%",
                    status: "Applied",
                  },
                  {
                    title: "Reallocated $15/day from Meta to TikTok",
                    time: "Aug 16, 2026",
                    impact: "CPA reduced by -12%",
                    status: "Applied",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{item.time} • {item.impact}</div>
                    </div>

                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiTools;