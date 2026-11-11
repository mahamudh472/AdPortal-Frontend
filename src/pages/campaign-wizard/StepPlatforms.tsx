import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Code2,
  Gauge,
  HelpCircle,
  Rocket,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
  Bot,
  Check,
} from "lucide-react";
import {
  apiErrorMessage,
  stepPath,
  useWizard,
  useWizardConfig,
  type WizardMode,
  type WizardPlatform,
} from "@/lib/campaignWizard";
import { Chip, ErrorBanner, SideCard, Spinner, WizardFooter, WizardGrid } from "@/components/campaign/wizard/ui";

const LOGOS: Record<string, string> = {
  META: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_10_m3mnnq.png",
  GOOGLE: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_11_bdja1x.png",
  TIKTOK: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_12_siwhfp.png",
};

// People on several platforms overlap, so the combined reach is less than the sum.
const OVERLAP_FACTOR = 0.62;

const formatReach = (value: number) =>
  value >= 1_000_000_000 ? `${(value / 1_000_000_000).toFixed(1)}B+` : `${Math.round(value / 1_000_000)}M+`;

const level = (n: number) => (n >= 2 ? "High" : "Medium");
const COST_RANK: Record<string, number> = { Low: 0, Medium: 1, High: 2 };

const PlatformCard: React.FC<{
  platform: WizardPlatform;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}> = ({ platform, selected, disabled, onToggle }) => (
  <div
    role="checkbox"
    aria-checked={selected}
    aria-disabled={!platform.connected}
    tabIndex={platform.connected ? 0 : -1}
    onClick={() => !disabled && platform.connected && onToggle()}
    onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), !disabled && platform.connected && onToggle())}
    className={`flex flex-col gap-4 rounded-xl border p-4 transition sm:flex-row sm:items-center ${
      !platform.connected
        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
        : selected
          ? "cursor-pointer border-blue-400 bg-blue-50/60 ring-1 ring-blue-200"
          : "cursor-pointer border-slate-200 bg-white hover:border-slate-300"
    }`}
  >
    <div className="flex flex-1 items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-2">
        <img src={LOGOS[platform.key]} alt="" className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{platform.name}</p>
          {platform.recommended && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">Recommended</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              platform.connected ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {platform.connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{platform.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {platform.formats.map((format) => (
            <Chip key={format}>{format}</Chip>
          ))}
        </div>
      </div>
    </div>

    <div className="flex gap-6 text-xs sm:border-l sm:border-slate-200 sm:pl-6">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Users size={14} className="mt-0.5 text-blue-600" />
          <div>
            <p className="text-slate-500">Reach Potential</p>
            <p className="font-semibold text-slate-900">{platform.reach_label}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <TrendingUp size={14} className="mt-0.5 text-blue-600" />
          <div>
            <p className="text-slate-500">Best For</p>
            <p className="font-semibold text-slate-900">{platform.best_for.join(", ")}</p>
          </div>
        </div>
      </div>
      <span
        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
        }`}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </div>
  </div>
);

const StepPlatforms: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const { campaignId, campaign, loading, loadError, save, goToStep } = useWizard(mode);
  const { config, loading: configLoading } = useWizardConfig(campaignId);

  const [selected, setSelected] = useState<string[]>([]);
  const [showApi, setShowApi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (campaign) setSelected(campaign.platforms ?? []);
  }, [campaign]);

  const platforms = useMemo(() => config?.platforms ?? [], [config]);
  const anyConnected = platforms.some((p) => p.connected);
  const chosen = useMemo(() => platforms.filter((p) => selected.includes(p.key)), [platforms, selected]);

  const combinedReach = useMemo(() => {
    const sum = chosen.reduce((total, p) => total + p.reach_potential, 0);
    return chosen.length > 1 ? sum * OVERLAP_FACTOR : sum;
  }, [chosen]);

  const impact = useMemo(() => {
    if (!chosen.length) return null;
    const cost = chosen.map((p) => p.impact.cost).sort((a, b) => COST_RANK[b] - COST_RANK[a])[0];
    return { reach: level(chosen.length), cost, performance: "High", speed: "Fast" };
  }, [chosen]);

  const toggle = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    setError("");
  };

  const submit = async () => {
    if (!campaignId) {
      setError("Campaign not found. Please go back to step 1.");
      return;
    }
    if (!selected.length) {
      setError("Please select at least one platform.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save({ platforms: selected });
      goToStep(3);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to save platforms.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || configLoading) return <Spinner />;

  const rec = config?.platform_recommendation;

  return (
    <WizardGrid
      aside={
        <>
          <SideCard icon={<Bot size={16} />} title="AI Recommendation" tone="green">
            <p className="mb-3 text-xs text-slate-600">
              Based on your business type and goals, we recommend these platforms.
            </p>
            <ul className="space-y-2 rounded-lg border border-green-100 bg-white p-3">
              {rec?.platforms.map((p) => (
                <li key={p.key} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-blue-600">{p.strength}</p>
                  </div>
                </li>
              ))}
            </ul>
            {rec && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-green-100/70 p-3">
                <div>
                  <p className="text-xs text-slate-600">Expected Improvement</p>
                  <p className="text-xl font-bold text-green-700">+{rec.expected_improvement_percent}%</p>
                  <p className="text-xs text-slate-600">Better overall performance</p>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            )}
          </SideCard>
          <SideCard icon={<HelpCircle size={16} />} title="Need help choosing?">
            <p className="text-xs text-slate-500">
              Platforms marked Recommended match your industry and objective. Only connected ad accounts can be
              selected — connect more in Settings.
            </p>
          </SideCard>
          <SideCard icon={<BookOpen size={16} />} title="Learn More">
            <p className="text-xs text-slate-500">
              Running on several platforms widens your reach; budgets are split between them in the next steps.
            </p>
          </SideCard>
        </>
      }
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Select Platforms</h2>
        <p className="text-sm text-slate-600">
          Choose where you want to run your campaign. You can select multiple platforms.
        </p>
        {campaignId && <p className="mt-1 text-xs text-slate-500">Campaign ID: {campaignId}</p>}
      </div>

      <ErrorBanner message={loadError || error} />

      {!anyConnected && (
        <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="text-amber-600" size={24} />
          </div>
          <h3 className="font-semibold text-amber-900">No Ad Accounts Connected</h3>
          <p className="mt-1 max-w-sm text-sm text-amber-700">
            Connect your Meta, Google, or TikTok ad accounts in settings before selecting platforms.
          </p>
          <Link
            to="/user-dashboard/settings"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Settings size={16} /> Go to Settings
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.key}
            platform={platform}
            selected={selected.includes(platform.key)}
            disabled={busy}
            onToggle={() => toggle(platform.key)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">Selected Platforms (API format)</p>
            <div className="flex flex-wrap gap-2">
              {chosen.length === 0 && <span className="text-sm italic text-slate-500">No platforms selected yet</span>}
              {chosen.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-1.5 text-sm"
                >
                  <img src={LOGOS[p.key]} alt="" className="h-4 w-4 object-contain" />
                  {p.name}
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => toggle(p.key)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {chosen.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Estimated Combined Reach</p>
                  <p className="font-semibold text-slate-900">{formatReach(combinedReach)} users</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowApi((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Code2 size={15} /> View API Preview
            </button>
          </div>
        </div>
        {showApi && (
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify({ campaign_id: campaignId ? Number(campaignId) : null, platforms: selected }, null, 2)}
          </pre>
        )}
      </div>

      {impact && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold text-blue-600">Impact Preview (Based on your selection)</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: <Users size={18} />, label: "Reach", value: impact.reach, hint: "Great potential audience size" },
              { icon: <Wallet size={18} />, label: "Cost", value: impact.cost, hint: "Balanced cost efficiency" },
              { icon: <Gauge size={18} />, label: "Performance", value: impact.performance, hint: "Strong results potential" },
              { icon: <Rocket size={18} />, label: "Speed", value: impact.speed, hint: "Quick campaign delivery" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="font-semibold text-slate-900">{item.value}</p>
                  <p className="text-[11px] text-slate-500">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <WizardFooter
        previousTo={stepPath(mode, 1, campaignId)}
        previousState={{ resume: true }}
        onNext={submit}
        busy={busy}
        disabled={!campaignId || selected.length === 0}
      />
    </WizardGrid>
  );
};

export default StepPlatforms;
