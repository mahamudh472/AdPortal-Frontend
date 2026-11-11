import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, Eye, HelpCircle, Lightbulb, Megaphone, PencilLine, RefreshCw, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import { apiErrorMessage, clearCreateState, getOrgId, useWizard, type WizardMode } from "@/lib/campaignWizard";
import {
  Card,
  CardHeader,
  CheckRow,
  ErrorBanner,
  SideCard,
  Spinner,
  WizardFooter,
  WizardGrid,
  inputClass,
} from "@/components/campaign/wizard/ui";

const NAME_MAX = 100;

const NameSuggestions: React.FC<{ campaignId: string | null; onPick: (name: string) => void }> = ({
  campaignId,
  onPick,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (nextOffset: number) => {
      const orgId = getOrgId();
      if (!orgId) return;
      setLoading(true);
      try {
        const res = await api.post<{ suggestions: string[]; next_offset: number }>(
          `/main/campaign-wizard/name-suggestions/?org_id=${orgId}`,
          { offset: nextOffset, ...(campaignId ? { campaign_id: Number(campaignId) } : {}) },
        );
        setSuggestions(res.data.suggestions);
        setOffset(res.data.next_offset);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [campaignId],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <SideCard icon={<Sparkles size={16} />} title="AI Name Suggestions">
      <p className="mb-3 text-xs text-slate-500">Let AI help you find the perfect name for your campaign.</p>
      {loading ? (
        <Spinner label="Thinking…" />
      ) : suggestions.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">Suggestions are unavailable right now.</p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((name) => (
            <li key={name} className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-sm font-medium text-slate-800">{name}</p>
              <button
                type="button"
                onClick={() => onPick(name)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                <ArrowRight size={12} /> Use This Name
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => load(offset)}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Generate More
      </button>
    </SideCard>
  );
};

const StepName: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const location = useLocation();
  // Entering the create flow from "New Campaign" starts a brand-new draft; coming back via "Previous" edits it.
  const resume = mode === "create" && Boolean((location.state as { resume?: boolean } | null)?.resume);
  const fresh = mode === "create" && !resume;
  const { campaignId, campaign, loading, loadError, save, goToStep } = useWizard(mode, fresh);

  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fresh) clearCreateState();
  }, [fresh]);

  useEffect(() => {
    if (campaign) setName(campaign.name);
  }, [campaign]);

  const trimmed = name.trim();
  const valid = trimmed.length > 0 && trimmed.length <= NAME_MAX;

  const submit = async () => {
    setTouched(true);
    if (!valid) {
      setError(trimmed ? `Campaign name must be ${NAME_MAX} characters or fewer.` : "Campaign name is required.");
      return;
    }
    if (!getOrgId()) {
      setError("No organization selected.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await save({ campaign_name: trimmed });
      if (mode === "create") {
        localStorage.setItem("campaignId", String(saved.id));
        localStorage.setItem("campaignStatus", saved.status);
        localStorage.setItem("campaignName", saved.name);
      }
      goToStep(2, saved.id);
    } catch (err) {
      const message = apiErrorMessage(err, "Something went wrong.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading campaign…" />;

  return (
    <WizardGrid
      aside={
        <>
          <NameSuggestions
            campaignId={campaignId}
            onPick={(value) => {
              setName(value.slice(0, NAME_MAX));
              setError("");
            }}
          />
          <SideCard icon={<Eye size={16} />} title="Why it matters">
            <ul className="space-y-2">
              <CheckRow>Easy to identify and organize</CheckRow>
              <CheckRow>Better tracking and reporting</CheckRow>
              <CheckRow>Helps your team stay aligned</CheckRow>
            </ul>
          </SideCard>
          <SideCard icon={<HelpCircle size={16} />} title="Need help?">
            <p className="text-xs text-slate-500">
              Pick a suggestion or write your own. You can rename the campaign any time before you publish it.
            </p>
          </SideCard>
        </>
      }
    >
      <ErrorBanner message={loadError} />
      <Card className="relative overflow-hidden">
        <CardHeader
          icon={<PencilLine size={20} />}
          title="Campaign Name"
          subtitle="This is how you will identify your campaign in your dashboard and reports."
        />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <label htmlFor="campaign-name" className="mb-2 block text-sm font-semibold text-slate-800">
              Campaign Name
            </label>
            <div className="relative">
              <input
                id="campaign-name"
                type="text"
                value={name}
                maxLength={NAME_MAX}
                placeholder="Transform Your Business Today"
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                aria-invalid={touched && !valid}
                className={`${inputClass} pr-10 ${touched && !valid ? "border-red-400" : ""}`}
              />
              {valid && (
                <CheckCircle2 size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">Choose a clear and descriptive name for easy tracking and reporting.</p>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Lightbulb size={16} className="text-blue-600" /> Pro Tip
              </div>
              <p className="mb-3 text-xs text-slate-600">
                Use a naming format that helps you stay organized and analyze performance easily.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                {["Brand", "Goal", "Audience"].map((part, i) => (
                  <React.Fragment key={part}>
                    {i > 0 && <span className="text-slate-400">+</span>}
                    <span className="rounded-full bg-blue-100/70 px-3 py-1">{part}</span>
                  </React.Fragment>
                ))}
              </div>
              <p className="mt-3 text-xs italic text-slate-500">Example: Nike – Conversions – Gen Z</p>
            </div>
          </div>

          <div className="hidden items-center justify-center md:flex" aria-hidden="true">
            <div className="relative w-full rounded-2xl bg-blue-50 p-4">
              <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                <div className="mb-3 flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Megaphone size={22} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 rounded bg-slate-200" />
                    <div className="h-2 w-2/3 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {touched && error && <ErrorBanner message={error} />}

      <WizardFooter onNext={submit} busy={busy} />
    </WizardGrid>
  );
};

export default StepName;
