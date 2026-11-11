import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  HelpCircle,
  PencilLine,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  CircleDollarSign,
  BarChart3,
  Bot,
  BookOpen,
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
import { ErrorBanner, SideCard, Spinner, WizardFooter, WizardGrid, inputClass } from "@/components/campaign/wizard/ui";

interface Recommendation {
  recommended_daily_budget: number;
  split: { platform: string; daily_budget: number; percent: number }[];
  estimated_results: {
    reach_label: string;
    conversions_min: number;
    conversions_max: number;
    cost_per_result: string;
  };
  highlights: string[];
  presets: { key: string; label: string; daily_budget: number }[];
}

const COLORS: Record<string, string> = { TIKTOK: "#0f172a", GOOGLE: "#ef4444", META: "#2563eb" };
const LOGOS: Record<string, string> = {
  META: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_10_m3mnnq.png",
  GOOGLE: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_11_bdja1x.png",
  TIKTOK: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1765754457/Container_12_siwhfp.png",
};

const toISO = (d: Date) => d.toISOString().split("T")[0];
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
};
const daysBetween = (start: string, end: string) =>
  Math.max(0, Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86_400_000));
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const Donut: React.FC<{ slices: { platform: string; value: number }[] }> = ({ slices }) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let acc = 0;
  const stops = slices
    .map((s) => {
      const from = (acc / total) * 100;
      acc += s.value;
      return `${COLORS[s.platform]} ${from}% ${(acc / total) * 100}%`;
    })
    .join(", ");
  return (
    <div
      role="img"
      aria-label="Budget distribution by platform"
      className="relative h-24 w-24 shrink-0 rounded-full"
      style={{ background: total ? `conic-gradient(${stops})` : "#e2e8f0" }}
    >
      <div className="absolute inset-[22%] rounded-full bg-white" />
    </div>
  );
};

const StepBudget: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const { campaignId, campaign, loading, loadError, save, goToStep } = useWizard(mode);
  const { config, loading: configLoading } = useWizardConfig(campaignId);

  const today = toISO(new Date());
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [budgetTypes, setBudgetTypes] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 30));
  const [continuous, setContinuous] = useState(false);
  const [editingTotal, setEditingTotal] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [initialised, setInitialised] = useState(false);

  const platformKeys = Object.keys(amounts);
  const total = platformKeys.reduce((sum, key) => sum + (amounts[key] || 0), 0);
  const days = continuous ? 30 : daysBetween(startDate, endDate);

  const fetchRecommendation = useCallback(
    async (platforms: string[], dailyBudget?: number, duration = 30) => {
      const orgId = getOrgId();
      if (!orgId || !platforms.length) return null;
      const { data } = await api.post<Recommendation>(`/main/campaign-wizard/budget-recommendation/?org_id=${orgId}`, {
        platforms,
        objective: campaign?.objective || "",
        ...(dailyBudget ? { daily_budget: dailyBudget } : {}),
        days: Math.max(1, duration),
      });
      return data;
    },
    [campaign?.objective],
  );

  // Seed the form once from the saved campaign (or from the AI split for a new one).
  useEffect(() => {
    if (initialised || loading || configLoading || !campaign) return;
    const platforms = campaign.platforms ?? [];
    const saved = campaign.budgets ?? [];
    const first = saved[0];
    if (first?.start_date) setStartDate(first.start_date);
    if (first?.end_date) setEndDate(first.end_date);
    if (first?.run_continuously) setContinuous(true);
    setBudgetTypes(Object.fromEntries(saved.map((b) => [b.platform, b.budget_type])));

    if (saved.length) {
      setAmounts(Object.fromEntries(saved.map((b) => [b.platform, Math.round(Number(b.budget))])));
      setInitialised(true);
    } else if (platforms.length) {
      fetchRecommendation(platforms)
        .then((data) => data && setAmounts(Object.fromEntries(data.split.map((s) => [s.platform, s.daily_budget]))))
        .catch(() => setAmounts(Object.fromEntries(platforms.map((p) => [p, 50]))))
        .finally(() => setInitialised(true));
    } else {
      setInitialised(true);
    }
  }, [campaign, config, configLoading, fetchRecommendation, initialised, loading]);

  // Refresh estimated results whenever the numbers change.
  useEffect(() => {
    if (!initialised || !total) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchRecommendation(platformKeys, total, days)
        .then((data) => !cancelled && data && setRec(data))
        .catch(() => undefined);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialised, total, days, platformKeys.join(",")]);

  const setAmount = (platform: string, value: number) =>
    setAmounts((prev) => ({ ...prev, [platform]: Math.max(0, Math.round(Number.isFinite(value) ? value : 0)) }));

  /** Scales every platform proportionally so the amounts add up to `target`. */
  const setTotal = (target: number) => {
    const next = Math.max(platformKeys.length, Math.round(target));
    const weights = platformKeys.map((k) => amounts[k] || 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const scaled = weights.map((w) => Math.floor((next * w) / weightSum));
    let leftover = next - scaled.reduce((a, b) => a + b, 0);
    for (let i = 0; leftover > 0; i = (i + 1) % scaled.length, leftover--) scaled[i] += 1;
    setAmounts(Object.fromEntries(platformKeys.map((k, i) => [k, scaled[i]])));
  };

  const applySplit = async (dailyBudget: number) => {
    try {
      const data = await fetchRecommendation(platformKeys, dailyBudget, days);
      if (data) setAmounts(Object.fromEntries(data.split.map((s) => [s.platform, s.daily_budget])));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't get a recommendation."));
    }
  };

  const available = (config?.platforms ?? []).filter((p) => p.connected && !platformKeys.includes(p.key));

  const submit = async () => {
    if (!campaignId) {
      setError("Campaign not found. Please go back to step 1.");
      return;
    }
    if (!platformKeys.length) {
      setError("Select at least one platform in step 2 before setting a budget.");
      return;
    }
    if (platformKeys.some((k) => !(amounts[k] > 0))) {
      setError("Every platform needs a daily budget of at least $1.");
      return;
    }
    if (!startDate) {
      setError("Please choose a start date.");
      return;
    }
    if (!continuous && (!endDate || endDate < startDate)) {
      setError("End date can't be before the start date.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save({
        budgets: platformKeys.map((platform) => ({
          platform,
          budget_type: budgetTypes[platform] || "DAILY",
          start_date: startDate,
          end_date: continuous ? null : endDate,
          budget: amounts[platform],
          run_continuously: continuous,
        })),
      });
      goToStep(6);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to save budget.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const presets = rec?.presets ?? config?.budget_presets ?? [];
  const optimal = rec ? total === rec.recommended_daily_budget : false;

  const summary = useMemo(
    () => [
      { icon: <Users size={16} />, label: "Reach", value: rec?.estimated_results.reach_label ?? "—" },
      {
        icon: <TrendingUp size={16} />,
        label: "Conversions",
        value: rec ? `${rec.estimated_results.conversions_min} – ${rec.estimated_results.conversions_max}` : "—",
      },
      { icon: <CircleDollarSign size={16} />, label: "Cost per Result", value: rec ? `$${rec.estimated_results.cost_per_result}` : "—" },
    ],
    [rec],
  );

  if (loading || configLoading || !initialised) return <Spinner />;

  return (
    <WizardGrid
      aside={
        <>
          <SideCard icon={<Bot size={16} />} title="AI Budget Recommendation" badge="Recommended">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-slate-600">Recommended Daily Budget</p>
              <p className="text-2xl font-bold text-slate-900">
                ${money(rec?.recommended_daily_budget ?? 0)} <span className="text-xs font-normal text-slate-500">USD/day</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">This budget is optimized for your audience and objective.</p>
            </div>
            <ul className="mt-3 space-y-2">
              {(rec?.highlights ?? []).map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="text-green-500" /> {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={!rec}
              onClick={() => rec && applySplit(rec.recommended_daily_budget)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <Sparkles size={15} /> Apply AI Split
            </button>
            {rec && (
              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                {rec.split.map((s) => (
                  <li key={s.platform} className="flex justify-between">
                    <span>{PLATFORM_LABEL[s.platform]}</span>
                    <span>
                      ${s.daily_budget} ({s.percent}%)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SideCard>

          <SideCard icon={<BarChart3 size={16} />} title="Budget Distribution">
            {total > 0 ? (
              <div className="flex items-center gap-4">
                <Donut slices={platformKeys.map((p) => ({ platform: p, value: amounts[p] || 0 }))} />
                <ul className="flex-1 space-y-1.5 text-xs">
                  {platformKeys.map((p) => (
                    <li key={p} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[p] }} />
                        {PLATFORM_LABEL[p]}
                      </span>
                      <span className="text-slate-600">
                        ${money(amounts[p] || 0)} ({Math.round(((amounts[p] || 0) / total) * 100)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Set a budget to see the distribution.</p>
            )}
            <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Total Daily Budget</dt>
                <dd className="font-semibold text-slate-900">${money(total)} USD</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Campaign Duration</dt>
                <dd className="font-semibold text-slate-900">{continuous ? "Continuous" : `${days} Days`}</dd>
              </div>
            </dl>
          </SideCard>

          <SideCard icon={<HelpCircle size={16} />} title="Need Help?">
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <BookOpen size={14} className="mt-0.5 shrink-0" />
              Daily budgets are an average — platforms may spend up to 25% more on high-opportunity days.
            </p>
          </SideCard>
        </>
      }
    >
      <ErrorBanner message={loadError || error} />

      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr_1.4fr] lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Wallet size={26} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Total Daily Budget</p>
              {editingTotal ? (
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold">$</span>
                  <input
                    autoFocus
                    type="number"
                    min={platformKeys.length}
                    defaultValue={total}
                    aria-label="Total daily budget"
                    onBlur={(e) => {
                      setTotal(Number(e.target.value));
                      setEditingTotal(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xl font-bold"
                  />
                </div>
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  ${money(total)} <span className="text-xs font-normal text-slate-500">USD / day</span>
                </p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs">
                {optimal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">
                    <CheckCircle2 size={12} /> Optimal Budget
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingTotal(true)}
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                >
                  <PencilLine size={12} /> Edit Manually
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2 lg:border-l lg:border-blue-200 lg:pl-5">
            <div>
              <p className="text-xs text-slate-500">Total Campaign Spend</p>
              <p className="text-xl font-bold text-slate-900">{continuous ? `$${money(total)}/day` : `$${money(total * days)}`}</p>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar size={13} /> {continuous ? "Runs continuously" : `${days} Days`}
            </p>
          </div>
          <div className="lg:border-l lg:border-blue-200 lg:pl-5">
            <p className="mb-2 text-xs text-slate-500">Estimated Results</p>
            <div className="grid grid-cols-3 gap-3">
              {summary.map((item) => (
                <div key={item.label}>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="text-blue-600">{item.icon}</span>
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">1</span>
            <div>
              <h2 className="font-semibold text-slate-900">Allocate Budget by Platform</h2>
              <p className="text-xs text-slate-500">Distribute your daily budget across selected platforms.</p>
            </div>
          </div>

          {platformKeys.length === 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              No platforms selected yet. Go back to step 2 to choose where to run this campaign.
            </p>
          )}

          <div className="space-y-4">
            {platformKeys.map((platform) => {
              const percent = total ? Math.round(((amounts[platform] || 0) / total) * 100) : 0;
              return (
                <div key={platform} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_9rem_1fr_auto]">
                  <img src={LOGOS[platform]} alt="" className="h-9 w-9 rounded-lg border border-slate-200 object-contain p-1" />
                  <div className="sm:order-none">
                    <p className="text-sm font-semibold text-slate-900">{PLATFORM_LABEL[platform]}</p>
                    <p className="text-xs text-slate-500">
                      {budgetTypes[platform] === "ONETIME" ? "Lifetime Budget" : "Daily Budget"}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={amounts[platform] ?? 0}
                        aria-label={`${PLATFORM_LABEL[platform]} budget`}
                        onChange={(e) => setAmount(platform, Number(e.target.value))}
                        className={`${inputClass} pl-6 pr-2`}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(total, amounts[platform] || 0, 10)}
                      step={1}
                      value={amounts[platform] ?? 0}
                      aria-label={`${PLATFORM_LABEL[platform]} share`}
                      onChange={(e) => setAmount(platform, Number(e.target.value))}
                      className="h-1.5 min-w-0 flex-1 accent-blue-600"
                    />
                  </div>
                  <p className="hidden text-right text-xs sm:block">
                    <span className="block text-sm font-semibold text-slate-900">{percent}%</span>
                    <span className="text-slate-500">of total</span>
                  </p>
                </div>
              );
            })}
          </div>

          {available.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {available.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setAmount(p.key, Math.max(10, Math.round(total * 0.2)))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  <Plus size={14} /> Add {PLATFORM_LABEL[p.key]}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Total Daily Budget</p>
              <p className="text-xs text-slate-500">Your budget will be distributed across platforms</p>
            </div>
            <p className="text-lg font-bold text-blue-600">
              ${money(total)} <span className="text-xs font-normal text-slate-500">USD/day</span>
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">2</span>
            <div>
              <h2 className="font-semibold text-slate-900">Set Campaign Schedule</h2>
              <p className="text-xs text-slate-500">Choose when your campaign will run.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-date" className="mb-1.5 block text-xs font-medium text-slate-600">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="mb-1.5 block text-xs font-medium text-slate-600">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={continuous ? "" : endDate}
                min={startDate}
                disabled={continuous}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={continuous}
              onChange={(e) => {
                setContinuous(e.target.checked);
                if (!e.target.checked && !endDate) setEndDate(addDays(startDate, 30));
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Run continuously (no end date)
          </label>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Campaign Duration</p>
              <p className="text-lg font-bold text-slate-900">{continuous ? "Continuous" : `${days} Days`}</p>
              <p className="text-xs text-slate-500">
                {continuous
                  ? `Your campaign will start on ${longDate(startDate)} and keep running.`
                  : `Your campaign will run from ${longDate(startDate)} to ${longDate(endDate)}`}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center">
        <div className="lg:w-48">
          <p className="font-semibold text-blue-600">Quick Budget Setup</p>
          <p className="text-xs text-slate-500">Choose a preset or let AI optimize for you</p>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-3">
          {presets.map((preset) => {
            const active = total === preset.daily_budget;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => (platformKeys.length ? applySplit(preset.daily_budget) : undefined)}
                className={`rounded-lg border p-3 text-center transition ${
                  active ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="flex items-center justify-center gap-1 text-sm font-medium text-slate-800">
                  {preset.key === "recommended" && <Star size={13} className="fill-blue-600 text-blue-600" />}
                  {preset.label}
                </p>
                <p className="text-xs text-slate-500">${money(preset.daily_budget)} / day</p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 p-3 lg:w-72">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Sparkles size={14} className="text-green-600" /> AI Optimize
            </p>
            <p className="text-xs text-slate-600">Let AI find the best budget split</p>
          </div>
          <button
            type="button"
            disabled={!total}
            onClick={() => applySplit(total)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Optimize Now
          </button>
        </div>
      </section>

      <WizardFooter previousTo={stepPath(mode, 4, campaignId)} onNext={submit} busy={busy} disabled={!campaignId || !total} />
    </WizardGrid>
  );
};

export default StepBudget;
