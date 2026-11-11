import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Eye, HelpCircle, MapPin, Plus, RefreshCw, Sparkles, Users, User, X, Info } from "lucide-react";
import { apiErrorMessage, stepPath, useWizard, type WizardMode } from "@/lib/campaignWizard";
import { useAudienceReach } from "@/lib/useAudienceReach";
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

type Gender = "all" | "male" | "female";

const LOCATIONS = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "India", "Bangladesh"];
const MIN_AGE = 13;
const MAX_AGE = 65;
const SUGGESTION_PAGE = 5;

const parseKeywords = (value: string) =>
  value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

const StepAudience: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const { campaignId, campaign, loading, loadError, save, goToStep } = useWizard(mode);

  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("65");
  const [gender, setGender] = useState<Gender>("all");
  const [location, setLocation] = useState("United States");
  const [interests, setInterests] = useState<string[]>([]);
  const [draftInterest, setDraftInterest] = useState("");
  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const targeting = campaign?.audience_targeting;
    if (!targeting) return;
    setMinAge(String(targeting.min_age ?? 18));
    setMaxAge(String(targeting.max_age ?? 65));
    setGender((targeting.gender as Gender) || "all");
    if (targeting.locations?.[0]) setLocation(targeting.locations[0]);
    setInterests(parseKeywords(targeting.keywords || ""));
  }, [campaign]);

  const keywords = interests.join(", ");
  const reach = useAudienceReach({ minAge, maxAge, gender, location, interests: keywords });

  const locationOptions = useMemo(() => (LOCATIONS.includes(location) ? LOCATIONS : [location, ...LOCATIONS]), [location]);

  const addInterest = (raw: string) => {
    const additions = parseKeywords(raw).filter((k) => !interests.some((i) => i.toLowerCase() === k.toLowerCase()));
    if (additions.length) setInterests((prev) => [...prev, ...additions]);
    setDraftInterest("");
  };

  const suggestions = reach.interestSuggestions;
  const visibleSuggestions = suggestions.length
    ? Array.from({ length: Math.min(SUGGESTION_PAGE, suggestions.length) }, (_, i) => suggestions[(suggestionOffset + i) % suggestions.length])
    : [];

  const min = parseInt(minAge, 10);
  const max = parseInt(maxAge, 10);
  const ageError =
    !(min >= MIN_AGE && min <= MAX_AGE) || !(max >= MIN_AGE && max <= MAX_AGE)
      ? `Ages must be between ${MIN_AGE} and ${MAX_AGE}.`
      : min > max
        ? "Minimum age can't be higher than maximum age."
        : "";

  const submit = async () => {
    if (!campaignId) {
      setError("Campaign not found. Please go back to step 1.");
      return;
    }
    if (ageError) {
      setError(ageError);
      return;
    }
    if (!location) {
      setError("Please select a location.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save({ min_age: min, max_age: max, gender, locations: [location], keywords });
      goToStep(5);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to save audience.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  // Marker position on the "too specific → optimal → too broad" track.
  const markerPercent = reach.level === "too_specific" ? 12 : reach.level === "too_broad" ? 88 : 50;
  const levelStyle = {
    too_specific: { text: "text-red-600", pill: "bg-red-50 text-red-700", label: "Too specific" },
    optimal: { text: "text-green-600", pill: "bg-green-50 text-green-700", label: "Optimal Audience Size" },
    too_broad: { text: "text-orange-500", pill: "bg-orange-50 text-orange-700", label: "Too broad" },
  }[reach.level];
  const t = reach.thresholds;
  const fmt = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1000}K`);

  return (
    <WizardGrid
      aside={
        <>
          <SideCard icon={<Sparkles size={16} />} title="AI Audience Insights">
            <p className="mb-3 text-xs text-slate-500">We analyzed your selections and here's what we found.</p>
            {reach.headline && (
              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {reach.headline}
                </p>
                <p className="mt-1 pl-7 text-xs text-slate-600">
                  {reach.level === "optimal"
                    ? "This audience size works well for most campaigns."
                    : reach.level === "too_specific"
                      ? "Widen the age range or remove an interest to reach more people."
                      : "Add interests or narrow the age range to focus your spend."}
                </p>
              </div>
            )}
            <ul className="space-y-2">
              {reach.insights.map((item) => (
                <CheckRow key={item.label} ok={item.ok}>
                  {item.label}
                </CheckRow>
              ))}
            </ul>
          </SideCard>

          <SideCard icon={<Users size={16} />} title="Audience Summary">
            <dl className="space-y-2 text-sm">
              {[
                ["Age Range", `${minAge} - ${maxAge}`],
                ["Gender", gender === "all" ? "All Genders" : gender === "male" ? "Male" : "Female"],
                ["Location", location || "—"],
                ["Interests", `${interests.length} Selected`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              <Eye size={14} /> {showDetails ? "Hide Details" : "View Full Details"}
            </button>
            {showDetails && (
              <p className="mt-2 text-xs text-slate-600">
                {interests.length ? interests.join(", ") : "No interests or behaviors selected."}
              </p>
            )}
          </SideCard>

          <SideCard icon={<HelpCircle size={16} />} title="Need Help?">
            <p className="text-xs text-slate-500">
              Estimates update as you change targeting. Add interests that describe your best customers, then check the
              reach range sits in the optimal zone.
            </p>
          </SideCard>
        </>
      }
    >
      <ErrorBanner message={loadError || error} />
      <Card>
        <CardHeader icon={<Users size={20} />} title="Target Audience" subtitle="Define who you want to reach with your campaign." />

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { id: "min-age", label: "Minimum Age", value: minAge, set: setMinAge },
            { id: "max-age", label: "Maximum Age", value: maxAge, set: setMaxAge },
          ].map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-1.5 block text-sm font-semibold text-slate-800">
                {field.label}
              </label>
              <input
                id={field.id}
                type="number"
                inputMode="numeric"
                min={MIN_AGE}
                max={MAX_AGE}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                aria-invalid={Boolean(ageError)}
                className={`${inputClass} ${ageError ? "border-red-400" : ""}`}
              />
            </div>
          ))}
        </div>
        {ageError && <p className="mt-1.5 text-xs text-red-600">{ageError}</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-800">Gender</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Gender">
              {(
                [
                  ["all", "All Genders", <Users key="a" size={15} />],
                  ["male", "Male", <User key="m" size={15} />],
                  ["female", "Female", <User key="f" size={15} />],
                ] as [Gender, string, React.ReactNode][]
              ).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={gender === value}
                  onClick={() => setGender(value)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                    gender === value
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Locations
            </label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`${inputClass} appearance-none pl-9 pr-9`}
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="interests" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            Interests &amp; Behaviors <span className="font-normal text-slate-500">(Optional)</span>
            <Info size={13} className="text-slate-400" />
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            {interests.map((interest) => (
              <span key={interest} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-700">
                {interest}
                <button
                  type="button"
                  aria-label={`Remove ${interest}`}
                  onClick={() => setInterests((prev) => prev.filter((i) => i !== interest))}
                  className="rounded hover:bg-blue-100"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
            <input
              id="interests"
              value={draftInterest}
              onChange={(e) => setDraftInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addInterest(draftInterest);
                } else if (e.key === "Backspace" && !draftInterest && interests.length) {
                  setInterests((prev) => prev.slice(0, -1));
                }
              }}
              onBlur={() => draftInterest && addInterest(draftInterest)}
              placeholder="Type and press Enter…"
              className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Add keywords to help us find your ideal audience.</p>
        </div>

        {visibleSuggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <Sparkles size={14} className="text-blue-600" /> Suggested for you:
            </span>
            {visibleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addInterest(suggestion)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {suggestion} <Plus size={12} />
              </button>
            ))}
            {suggestions.length > SUGGESTION_PAGE && (
              <button
                type="button"
                onClick={() => setSuggestionOffset((o) => (o + SUGGESTION_PAGE) % suggestions.length)}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            )}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                Estimated Daily Reach <Info size={13} className="text-slate-400" />
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {reach.min} - {reach.max}
              </p>
              <span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs font-medium ${levelStyle.pill}`}>
                {reach.loading ? "Updating estimate…" : levelStyle.label}
              </span>
            </div>
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow sm:flex">
              <Users size={28} />
            </div>
          </div>

          <div className="mt-5">
            <div className="relative h-1.5 rounded-full bg-slate-200">
              <div className="absolute inset-y-0 left-[25%] right-[25%] rounded-full bg-blue-600" />
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-500 shadow transition-all"
                style={{ left: `${markerPercent}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="font-medium text-red-600">Too Specific</p>
                <p className="text-slate-500">&lt; {fmt(t.too_specific_below)}</p>
              </div>
              <div>
                <p className="font-medium text-green-600">Optimal Range</p>
                <p className="text-slate-500">
                  {fmt(t.optimal_min)} - {fmt(t.optimal_max)}
                </p>
              </div>
              <div>
                <p className="font-medium text-orange-500">Too Broad</p>
                <p className="text-slate-500">&gt; {fmt(t.too_broad_above)}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Estimate based on your targeting. Actual reach may vary.
          </p>
        </div>
      </Card>

      <WizardFooter previousTo={stepPath(mode, 3, campaignId)} onNext={submit} busy={busy} disabled={!campaignId} />
    </WizardGrid>
  );
};

export default StepAudience;
