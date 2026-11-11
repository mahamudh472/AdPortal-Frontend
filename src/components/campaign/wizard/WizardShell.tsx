import React, { Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { STEP_LABELS, TOTAL_STEPS, stepPath, type WizardMode } from "@/lib/campaignWizard";
import { useParams } from "react-router-dom";

const SUBTITLES: Record<number, string> = {
  1: "Let's start with the basics. Give your campaign a clear and memorable name.",
  2: "Choose the platform(s) you want to run your campaign on.",
  3: "Choose your campaign objective. This helps us optimize your ads for the best results.",
  4: "Define your target audience to reach the right people.",
  5: "Set your budget and schedule for each platform.",
  6: "Upload creative assets and write compelling ad copy.",
  7: "Review all details before publishing.",
};

const Stepper: React.FC<{ mode: WizardMode; current: number; campaignId?: string }> = ({ mode, current, campaignId }) => {
  const navigate = useNavigate();
  const resolvedId = mode === "create" ? localStorage.getItem("campaignId") : campaignId;

  return (
    <nav aria-label="Campaign steps" className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
      <ol className="flex min-w-[640px] items-stretch justify-between">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          // Create mode only lets you jump back; update mode edits an existing campaign, so any step is fine.
          const clickable = !active && (mode === "update" || (done && !!resolvedId));
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => navigate(stepPath(mode, step, resolvedId), { state: { resume: true } })}
                aria-current={active ? "step" : undefined}
                className={`flex w-full flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 transition ${
                  active ? "bg-blue-50" : clickable ? "hover:bg-slate-50" : ""
                } ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-green-500 text-white"
                      : active
                        ? "bg-blue-600 text-white"
                        : "border border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : step}
                </span>
                <span className={`text-xs ${active ? "font-semibold text-slate-900" : "text-slate-600"}`}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const WizardShell: React.FC<{ mode: WizardMode }> = ({ mode }) => {
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const current = Number(pathname.match(/step-(\d+)/)?.[1] ?? 1);
  const percent = Math.round((current / TOTAL_STEPS) * 100);
  const title = mode === "create" ? "Create New Campaign" : "Update Campaign";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
        <Link
          to="/user-dashboard/campaigns"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={15} /> Back to Campaigns
        </Link>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{SUBTITLES[current]}</p>
          </div>
          <div className="w-full sm:w-72">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-slate-700">
                Step {current} of {TOTAL_STEPS}
              </span>
              <span className="text-slate-500">{percent}% Complete</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>

        <Stepper mode={mode} current={current} campaignId={id} />

        <div className="mt-5">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading…</div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default WizardShell;
