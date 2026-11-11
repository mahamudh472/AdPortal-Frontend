import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  Lightbulb,
  MessageCircle,
  MousePointerClick,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { apiErrorMessage, stepPath, useWizard, useWizardConfig, type WizardMode } from "@/lib/campaignWizard";
import { Chip, ErrorBanner, SideCard, Spinner, WizardFooter, WizardGrid } from "@/components/campaign/wizard/ui";

const ICONS: Record<string, { icon: React.ReactNode; tint: string }> = {
  CONVERSIONS: { icon: <ShoppingCart size={22} />, tint: "bg-blue-50 text-blue-600" },
  TRAFFIC: { icon: <MousePointerClick size={22} />, tint: "bg-green-50 text-green-600" },
  AWARENESS: { icon: <Eye size={22} />, tint: "bg-purple-50 text-purple-600" },
  ENGAGEMENT: { icon: <MessageCircle size={22} />, tint: "bg-orange-50 text-orange-500" },
  LEAD_GENERATION: { icon: <Users size={22} />, tint: "bg-teal-50 text-teal-600" },
  APP_PROMOTION: { icon: <Smartphone size={22} />, tint: "bg-pink-50 text-pink-500" },
};

const StepObjective: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const { campaignId, campaign, loading, loadError, save, goToStep } = useWizard(mode);
  const { config, loading: configLoading } = useWizardConfig(campaignId);

  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const published = Boolean(campaign && campaign.status !== "DRAFT");

  useEffect(() => {
    if (campaign?.objective) setSelected(campaign.objective);
  }, [campaign]);

  // New campaigns start on the recommended objective so the panel and selection agree.
  useEffect(() => {
    if (!selected && !loading && config && !campaign?.objective) setSelected(config.objective_recommendation.objective);
  }, [config, campaign, loading, selected]);

  const submit = async () => {
    if (!campaignId) {
      setError("Campaign not found. Please go back to step 1.");
      return;
    }
    if (!selected) {
      setError("Please choose an objective.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Objective can't change once published; skip the write so the step stays usable.
      if (!(published && selected === campaign?.objective)) await save({ objective: selected });
      goToStep(4);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to save objective.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || configLoading) return <Spinner />;

  const objectives = config?.objectives ?? [];
  const current = objectives.find((o) => o.key === selected);
  const rec = config?.objective_recommendation;

  return (
    <WizardGrid
      aside={
        <>
          {rec && (
            <SideCard icon={<Sparkles size={16} />} title="AI Recommendation" tone="blue">
              <p className="mb-3 text-xs text-slate-600">Based on similar businesses and goals, we recommend:</p>
              <div className="mb-3 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ICONS[rec.objective]?.tint}`}>
                  {ICONS[rec.objective]?.icon}
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {rec.title}
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      Best Match
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">{rec.summary}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {rec.reasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={16} className="text-green-500" /> {reason}
                  </li>
                ))}
              </ul>
            </SideCard>
          )}
          <SideCard icon={<BookOpen size={16} />} title="Objective Guide">
            <p className="text-xs text-slate-500">
              Each objective tells the platforms what to optimize for — pick the one that matches the single most
              important result you want from this campaign.
            </p>
          </SideCard>
          <SideCard icon={<Lightbulb size={16} />} title="Pro Tip" tone="green">
            <p className="text-xs font-medium text-slate-700">Not sure which one to choose?</p>
            <p className="mt-1 text-xs text-slate-600">
              Use <strong>Conversions</strong> if you want measurable actions and ROI.
            </p>
          </SideCard>
        </>
      }
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Select Campaign Objective</h2>
        <p className="text-sm text-slate-600">What's your main goal for this campaign?</p>
        {campaignId && <p className="mt-1 text-xs text-slate-500">Campaign ID: {campaignId}</p>}
      </div>

      <ErrorBanner message={loadError || error} />
      {published && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          This campaign is already published, so its objective can't be changed.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Campaign objective">
        {objectives.map((objective) => {
          const isSelected = selected === objective.key;
          const locked = published && objective.key !== campaign?.objective;
          return (
            <div
              key={objective.key}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={locked}
              tabIndex={locked ? -1 : 0}
              onClick={() => !locked && !busy && setSelected(objective.key)}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), !locked && setSelected(objective.key))}
              className={`relative rounded-xl border p-4 transition ${
                locked
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                  : isSelected
                    ? "cursor-pointer border-blue-400 bg-blue-50/50 ring-1 ring-blue-200"
                    : "cursor-pointer border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border ${
                  isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {isSelected && <Check size={13} strokeWidth={3} />}
              </span>
              <div className="flex items-start gap-3 pr-6">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ICONS[objective.key]?.tint}`}>
                  {ICONS[objective.key]?.icon}
                </div>
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                    {objective.title}
                    {objective.recommended && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        Recommended
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{objective.description}</p>
                </div>
              </div>
              <p className="mb-2 mt-4 text-xs text-slate-500">Best for:</p>
              <div className="flex flex-wrap gap-1.5">
                {objective.best_for.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">Selected Objective</p>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ICONS[current.key]?.tint}`}>
                {ICONS[current.key]?.icon}
              </div>
              <p className="font-semibold text-slate-900">{current.title}</p>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                API: {current.key}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{current.description}</p>
          </div>
          <div className="hidden h-16 w-16 items-center justify-center rounded-full bg-white text-blue-500 shadow-sm sm:flex">
            <Target size={32} />
          </div>
        </div>
      )}

      <WizardFooter previousTo={stepPath(mode, 2, campaignId)} onNext={submit} busy={busy} disabled={!campaignId || !selected} />
    </WizardGrid>
  );
};

export default StepObjective;
