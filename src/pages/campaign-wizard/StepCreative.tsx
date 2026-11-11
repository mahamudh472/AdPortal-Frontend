import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bookmark,
  Bot,
  ChevronDown,
  ChevronUp,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  MessageCircle,
  MoreVertical,
  Pencil,
  Send,
  Sparkles,
  UploadCloud,
  Video,
  X,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/axios";
import {
  PLATFORM_LABEL,
  apiErrorMessage,
  getOrgId,
  stepPath,
  useWizard,
  useWizardConfig,
  type WizardMode,
} from "@/lib/campaignWizard";
import { CheckRow, ErrorBanner, SideCard, Spinner, WizardFooter, WizardGrid, inputClass } from "@/components/campaign/wizard/ui";

type AdFormat = "image" | "video";

interface CreativeScore {
  score: number;
  max_score: number;
  label: string;
  message: string;
  checks: { label: string; ok: boolean }[];
}

interface GeneratedCopy {
  headline?: string;
  primary_text?: string;
  description?: string;
  call_to_action?: string;
}

const MAX_BYTES: Record<AdFormat, number> = { image: 10 * 1024 * 1024, video: 50 * 1024 * 1024 };
const TONES = ["Professional", "Friendly", "Bold", "Casual", "Exciting", "Humorous"];
const DEFAULT_LIMITS = { headline: 40, description: 30, primary_text: 125 };

const normaliseUrl = (value: string) => {
  const url = value.trim();
  return url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;
};

const brandName = () => {
  try {
    return JSON.parse(localStorage.getItem("selectedOrganization") || "null")?.name || "Your Brand";
  } catch {
    return "Your Brand";
  }
};

const Counter: React.FC<{ value: string; max: number }> = ({ value, max }) => (
  <span className={`text-xs ${value.length >= max ? "text-amber-600" : "text-slate-400"}`}>
    {value.length}/{max}
  </span>
);

const ScoreRing: React.FC<{ score: number; max: number }> = ({ score, max }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Score ${score} out of ${max}`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={score >= 80 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#ef4444"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / max)}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-[11px] text-slate-500">/{max}</span>
      </div>
    </div>
  );
};

interface PreviewProps {
  platform: string;
  brand: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  url: string;
  mediaUrl: string;
  isVideo: boolean;
}

const AdPreview: React.FC<PreviewProps> = ({ platform, brand, headline, primaryText, description, cta, url, mediaUrl, isVideo }) => {
  const host = url.replace(/^https?:\/\//i, "").split("/")[0] || "example.com";

  if (platform === "GOOGLE") {
    return (
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-xs text-slate-500">
          <span className="mr-2 rounded border border-slate-400 px-1 text-[10px] font-semibold text-slate-700">Ad</span>
          {host}
        </p>
        <p className="mt-1 text-lg text-blue-700">{headline || "Your headline appears here"}</p>
        <p className="mt-1 text-sm text-slate-600">{primaryText || "Your primary text appears here."}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {brand.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{brand}</p>
            <p className="text-xs text-slate-500">Sponsored</p>
          </div>
        </div>
        <MoreVertical size={16} className="text-slate-500" />
      </div>
      <div className="relative flex aspect-[1.91/1] items-center justify-center bg-slate-100">
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} className="h-full w-full object-cover" muted controls />
          ) : (
            <img src={mediaUrl} alt="Creative preview" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="text-center text-xs text-slate-400">
            <ImageIcon className="mx-auto mb-1" size={26} />
            Your creative appears here
          </div>
        )}
        {mediaUrl && headline && (
          <p className="absolute bottom-2 left-3 right-3 text-lg font-bold text-white drop-shadow">{headline}</p>
        )}
      </div>
      <div className="space-y-1 p-3 text-sm">
        {!mediaUrl && headline && <p className="font-semibold text-slate-900">{headline}</p>}
        <p className="text-slate-700">{primaryText || "Your primary text appears here."}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-slate-500">{host}</p>
            <p className="text-xs font-medium text-slate-700">{cta}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">{cta}</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-slate-600">
        <div className="flex gap-4">
          <Heart size={18} />
          <MessageCircle size={18} />
          <Send size={18} />
        </div>
        <Bookmark size={18} />
      </div>
    </div>
  );
};

const StepCreative: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const { campaignId, campaign, loading, loadError, save, goToStep } = useWizard(mode);
  const { config, loading: configLoading } = useWizardConfig(campaignId);
  const limits = config?.limits ?? DEFAULT_LIMITS;
  const ctas = config?.call_to_actions ?? ["Shop now", "Learn More", "Sign Up", "Contact Us", "Book Now", "Download", "Get Quote"];

  const [adName, setAdName] = useState("");
  const [adFormat, setAdFormat] = useState<AdFormat>("image");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [savedFileUrl, setSavedFileUrl] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [draftKeyword, setDraftKeyword] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [description, setDescription] = useState("");
  const [cta, setCta] = useState("Shop now");
  const [previewPlatform, setPreviewPlatform] = useState("");

  const [showGenerator, setShowGenerator] = useState(false);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [benefits, setBenefits] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [generating, setGenerating] = useState(false);

  const [score, setScore] = useState<CreativeScore | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const generatorRef = useRef<HTMLDivElement>(null);
  const brand = useMemo(brandName, []);

  const published = Boolean(campaign && campaign.status !== "DRAFT");

  useEffect(() => {
    if (!campaign) return;
    const ad = campaign.ads?.[0];
    if (ad) {
      setAdName(ad.ad_name ?? ad.name ?? "");
      setHeadline(ad.headline ?? "");
      setPrimaryText(ad.primary_text ?? "");
      setDescription(ad.description ?? "");
      setCta(ad.call_to_action || "Shop now");
      setDestinationUrl(ad.destination_url ?? "");
      if (ad.ad_format) setAdFormat(ad.ad_format);
      setKeywords((ad.creative_keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean));
    }
    if (campaign.file_url) {
      setSavedFileUrl(campaign.file_url);
      if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(campaign.file_url)) setAdFormat("video");
    }
    setPreviewPlatform((prev) => prev || campaign.platforms?.[0] || "META");
  }, [campaign]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  // Debounced creative score from the backend.
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .post<CreativeScore>(`/main/campaign-wizard/creative-score/?org_id=${orgId}`, {
          headline,
          primary_text: primaryText,
          description,
          call_to_action: cta,
          destination_url: normaliseUrl(destinationUrl),
          keywords: keywords.join(", "),
          ad_format: adFormat,
          has_asset: Boolean(file || savedFileUrl),
        })
        .then((res) => !cancelled && setScore(res.data))
        .catch(() => undefined);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [headline, primaryText, description, cta, destinationUrl, keywords, adFormat, file, savedFileUrl]);

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!candidate.type.startsWith(`${adFormat}/`)) {
      toast.error(`Please choose ${adFormat === "image" ? "an image (PNG, JPG or WebP)" : "a video (MP4 or MOV)"} file.`);
      return;
    }
    if (candidate.size > MAX_BYTES[adFormat]) {
      toast.error(`File is too large. The limit is ${MAX_BYTES[adFormat] / 1024 / 1024}MB.`);
      return;
    }
    setFile(candidate);
    setSavedFileUrl("");
    setPreviewUrl(URL.createObjectURL(candidate));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl("");
    setSavedFileUrl("");
  };

  const changeFormat = (format: AdFormat) => {
    if (format === adFormat) return;
    setAdFormat(format);
    clearFile();
  };

  const addKeywords = (raw: string) => {
    const additions = raw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k && !keywords.some((existing) => existing.toLowerCase() === k.toLowerCase()));
    if (additions.length) setKeywords((prev) => [...prev, ...additions]);
    setDraftKeyword("");
  };

  const generate = async () => {
    if (!product.trim() || !audience.trim() || !benefits.trim()) {
      toast.warning("Fill in the product, audience and benefits to generate copy.");
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post<{ "Ad copy"?: GeneratedCopy }>(`/main/generate-ad-copy/?org_id=${getOrgId()}`, {
        product_service: product,
        target_audience: audience,
        key_benefits: benefits,
        tone: tone.toLowerCase(),
      });
      const copy = res.data?.["Ad copy"];
      if (!copy) throw new Error("empty");
      setHeadline((copy.headline ?? "").slice(0, limits.headline));
      setPrimaryText((copy.primary_text ?? "").slice(0, limits.primary_text));
      setDescription((copy.description ?? "").slice(0, limits.description));
      if (copy.call_to_action) setCta(copy.call_to_action);
      addKeywords(benefits);
      toast.success("Ad copy generated. Edit it any time.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to generate ad copy."));
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    if (!campaignId) {
      setError("Campaign not found. Please go back to step 1.");
      return;
    }
    const problems: string[] = [];
    if (!headline.trim()) problems.push("Add a headline.");
    if (!primaryText.trim()) problems.push("Add the primary text.");
    if (published && !destinationUrl.trim()) problems.push("A published campaign needs a destination URL.");
    if (problems.length) {
      setError(problems.join("\n"));
      return;
    }

    const fields: Record<string, string> = {
      ...(adName.trim() ? { ad_name: adName.trim() } : {}),
      ad_format: adFormat,
      headline: headline.trim(),
      primary_text: primaryText.trim(),
      description: description.trim(),
      call_to_action: cta,
      destination_url: normaliseUrl(destinationUrl),
      creative_keywords: keywords.join(", "),
    };

    setBusy(true);
    setError("");
    try {
      if (file) {
        const form = new FormData();
        Object.entries(fields).forEach(([key, value]) => form.append(key, value));
        form.append("ad_file", file);
        await save(form);
      } else {
        await save(fields);
      }
      goToStep(7);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to save the ad.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || configLoading) return <Spinner />;

  const mediaUrl = previewUrl || savedFileUrl;
  const previewPlatforms = campaign?.platforms?.length ? campaign.platforms : ["TIKTOK", "GOOGLE", "META"];
  const activePlatform = previewPlatforms.includes(previewPlatform) ? previewPlatform : previewPlatforms[0];
  const fieldLabel = "mb-1.5 block text-sm font-semibold text-slate-800";
  const optional = <span className="font-normal text-slate-500"> (Optional)</span>;

  return (
    <WizardGrid
      aside={
        <>
          <SideCard title="Creative Performance Score">
            {score ? (
              <>
                <div className="flex items-center gap-4">
                  <ScoreRing score={score.score} max={score.max_score} />
                  <div>
                    <p className="text-lg font-bold text-green-700">{score.label}</p>
                    <p className="text-xs text-slate-600">{score.message}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {score.checks.map((c) => (
                    <CheckRow key={c.label} ok={c.ok}>
                      <span className={c.ok ? "" : "text-slate-500"}>{c.label}</span>
                    </CheckRow>
                  ))}
                </ul>
              </>
            ) : (
              <Spinner label="Scoring…" />
            )}
            <button
              type="button"
              onClick={() => {
                setShowGenerator(true);
                setTimeout(() => generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <Sparkles size={15} /> Improve with AI
            </button>
          </SideCard>

          <SideCard icon={<Lightbulb size={16} />} title="Best Practices">
            <ul className="space-y-2 text-sm text-slate-700">
              {[
                "Use high quality, eye-catching images",
                "Keep text short and focused",
                "Highlight your unique value",
                "Include a strong call to action",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <ArrowRight size={14} className="mt-1 shrink-0 text-slate-400" /> {tip}
                </li>
              ))}
            </ul>
          </SideCard>

          <SideCard icon={<Lightbulb size={16} />} title="Creative Tips">
            <p className="text-xs text-slate-600">Videos tend to earn more engagement than static images on social feeds.</p>
          </SideCard>

          <SideCard icon={<HelpCircle size={16} />} title="Need Help?">
            <p className="mb-2 text-xs text-slate-500">Get AI-powered suggestions to improve your ad creative and copy.</p>
            <button
              type="button"
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <Bot size={14} /> Get Suggestions
            </button>
          </SideCard>
        </>
      }
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Create Your Ad</h2>
        <p className="text-sm text-slate-600">Upload creative assets and write compelling ad copy</p>
        {campaignId && <p className="mt-1 text-xs text-slate-500">Campaign ID: {campaignId}</p>}
      </div>

      <ErrorBanner message={loadError || error} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <div className="sm:col-span-2">
                <label htmlFor="ad-name" className={fieldLabel}>
                  Ad Name{optional}
                </label>
                <input
                  id="ad-name"
                  value={adName}
                  maxLength={100}
                  onChange={(e) => setAdName(e.target.value)}
                  placeholder="e.g. Summer Sale - Image Ad"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <p className={fieldLabel}>Ad Format</p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Ad format">
                {(
                  [
                    ["image", "Image Ad", "Single image with text", <ImageIcon key="i" size={22} />],
                    ["video", "Video Ad", "Video with text", <Video key="v" size={22} />],
                  ] as [AdFormat, string, string, React.ReactNode][]
                ).map(([value, label, hint, icon]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={adFormat === value}
                    onClick={() => changeFormat(value)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      adFormat === value ? "border-blue-400 bg-blue-50/60" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-slate-600">{icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{label}</span>
                      <span className="block text-xs text-slate-500">{hint}</span>
                    </span>
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${
                        adFormat === value ? "border-blue-600 bg-blue-600 ring-2 ring-white ring-inset" : "border-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={fieldLabel}>Upload Creative{optional}</p>
              <label
                onDragOver={(e) => (e.preventDefault(), setDragging(true))}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                  dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <UploadCloud className="mb-2 text-slate-400" size={26} />
                <span className="text-sm text-slate-700">Click to upload or drag and drop</span>
                <span className="text-xs text-slate-400">
                  {adFormat === "image" ? "PNG, JPG or WebP up to 10MB" : "MP4 or MOV up to 50MB"}
                </span>
                <input
                  type="file"
                  accept={adFormat === "image" ? "image/*" : "video/*"}
                  className="sr-only"
                  onChange={(e) => {
                    acceptFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {mediaUrl && (
                <div className="relative mt-3 inline-block">
                  {adFormat === "video" ? (
                    <video src={mediaUrl} className="h-20 w-32 rounded-lg border border-slate-200 object-cover" muted />
                  ) : (
                    <img src={mediaUrl} alt="Uploaded creative" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
                  )}
                  <button
                    type="button"
                    aria-label="Remove creative"
                    onClick={clearFile}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Supports: {adFormat === "image" ? "JPG, PNG, WebP" : "MP4, MOV"} • Max size:{" "}
                {MAX_BYTES[adFormat] / 1024 / 1024}MB
                {adFormat === "image" && " • Recommended: 1200x628px"}
              </p>
            </div>

            <div>
              <label htmlFor="keywords" className={fieldLabel}>
                Keywords{optional}
              </label>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                {keywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-700">
                    {k}
                    <button type="button" aria-label={`Remove ${k}`} onClick={() => setKeywords((prev) => prev.filter((x) => x !== k))}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <input
                  id="keywords"
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeywords(draftKeyword);
                    } else if (e.key === "Backspace" && !draftKeyword && keywords.length) {
                      setKeywords((prev) => prev.slice(0, -1));
                    }
                  }}
                  onBlur={() => draftKeyword && addKeywords(draftKeyword)}
                  placeholder="Type and press Enter…"
                  className="min-w-28 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="destination-url" className={fieldLabel}>
                Destination URL{optional}
              </label>
              <input
                id="destination-url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className={fieldLabel}>Ad Preview</p>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="mb-3 grid gap-1 rounded-lg bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${previewPlatforms.length}, 1fr)` }} role="tablist">
                {previewPlatforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={activePlatform === p}
                    onClick={() => setPreviewPlatform(p)}
                    className={`rounded-md py-1.5 text-sm font-medium ${
                      activePlatform === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {PLATFORM_LABEL[p] ?? p}
                  </button>
                ))}
              </div>
              <AdPreview
                platform={activePlatform}
                brand={brand}
                headline={headline}
                primaryText={primaryText}
                description={description}
                cta={cta}
                url={destinationUrl}
                mediaUrl={mediaUrl}
                isVideo={adFormat === "video"}
              />
            </div>
          </div>
        </div>
      </div>

      <div ref={generatorRef} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          aria-expanded={showGenerator}
          onClick={() => setShowGenerator((v) => !v)}
          className="flex w-full items-center justify-between gap-3 bg-slate-50 px-5 py-3 text-left hover:bg-slate-100"
        >
          <span className="flex items-center gap-2 text-sm">
            <Sparkles size={16} className="text-blue-600" />
            <span className="font-semibold text-slate-900">AI Copy Generator</span>
            <span className="text-xs text-slate-500">(AI will generate ad copy based on your product and audience.)</span>
          </span>
          {showGenerator ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </button>
        {showGenerator && (
          <div className="grid gap-4 border-t border-slate-200 p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="gen-product" className="mb-1 block text-xs font-medium text-slate-600">Product / Service</label>
              <input id="gen-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Wireless headphones" className={inputClass} />
            </div>
            <div>
              <label htmlFor="gen-audience" className="mb-1 block text-xs font-medium text-slate-600">Target Audience</label>
              <input id="gen-audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Music lovers, commuters" className={inputClass} />
            </div>
            <div>
              <label htmlFor="gen-benefits" className="mb-1 block text-xs font-medium text-slate-600">Key Benefits</label>
              <input id="gen-benefits" value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="e.g. Great sound, all-day battery" className={inputClass} />
            </div>
            <div>
              <label htmlFor="gen-tone" className="mb-1 block text-xs font-medium text-slate-600">Tone</label>
              <select id="gen-tone" value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:col-span-2"
            >
              <Sparkles size={15} /> {generating ? "Generating…" : "Generate Copy with AI"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Ad Copy</h3>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Pencil size={12} /> You can edit these fields anytime
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="headline" className="text-sm font-semibold text-slate-800">Headline</label>
              <Counter value={headline} max={limits.headline} />
            </div>
            <input id="headline" value={headline} maxLength={limits.headline} onChange={(e) => setHeadline(e.target.value)} placeholder={`Enter your ad headline (max ${limits.headline} characters)`} className={inputClass} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-semibold text-slate-800">
                Description{optional}
              </label>
              <Counter value={description} max={limits.description} />
            </div>
            <input id="description" value={description} maxLength={limits.description} onChange={(e) => setDescription(e.target.value)} placeholder={`Enter a short description (max ${limits.description} characters)`} className={inputClass} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="primary-text" className="text-sm font-semibold text-slate-800">Primary Text</label>
              <Counter value={primaryText} max={limits.primary_text} />
            </div>
            <textarea id="primary-text" value={primaryText} maxLength={limits.primary_text} rows={2} onChange={(e) => setPrimaryText(e.target.value)} placeholder={`Enter your primary ad text (max ${limits.primary_text} characters)`} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label htmlFor="cta" className="mb-1.5 block text-sm font-semibold text-slate-800">Call To Action</label>
            <div className="relative">
              <select id="cta" value={cta} onChange={(e) => setCta(e.target.value)} className={`${inputClass} appearance-none pr-9`}>
                {(ctas.includes(cta) ? ctas : [cta, ...ctas]).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      <WizardFooter previousTo={stepPath(mode, 5, campaignId)} onNext={submit} busy={busy} disabled={!campaignId} />
    </WizardGrid>
  );
};

export default StepCreative;
