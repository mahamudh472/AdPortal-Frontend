import React from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

/** Main column + right-hand guidance column used by every step. */
export const WizardGrid: React.FC<{ aside: React.ReactNode; children: React.ReactNode }> = ({ aside, children }) => (
  <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div className="min-w-0 space-y-5">{children}</div>
    <aside className="space-y-4 lg:sticky lg:top-4">{aside}</aside>
  </div>
);

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}>{children}</section>
);

export const CardHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="mb-5 flex items-center gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{icon}</div>
    <div>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

export const SideCard: React.FC<{
  icon?: React.ReactNode;
  title: string;
  tone?: "default" | "green" | "blue";
  badge?: string;
  children: React.ReactNode;
}> = ({ icon, title, tone = "default", badge, children }) => {
  const tones = {
    default: "border-slate-200 bg-white",
    green: "border-green-200 bg-green-50/60",
    blue: "border-blue-100 bg-blue-50/50",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="mb-2 flex items-center gap-2">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h3 className="flex-1 text-sm font-semibold text-slate-900">{title}</h3>
        {badge && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
};

export const CheckRow: React.FC<{ ok?: boolean; children: React.ReactNode }> = ({ ok = true, children }) => (
  <li className="flex items-center gap-2 text-sm text-slate-700">
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
        ok ? "bg-green-500 text-white" : "border border-slate-300 bg-white"
      }`}
    >
      {ok && <Check size={11} strokeWidth={3} />}
    </span>
    {children}
  </li>
);

export const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
    {children}
  </span>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) =>
  message ? (
    <div role="alert" className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  ) : null;

export const Spinner: React.FC<{ label?: string }> = ({ label = "Loading…" }) => (
  <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-slate-500">
    <Loader2 className="animate-spin" size={18} /> {label}
  </div>
);

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

/** Previous / Continue row at the bottom of each step. */
export const WizardFooter: React.FC<{
  previousTo?: string;
  previousState?: unknown;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  disabled?: boolean;
}> = ({ previousTo, previousState, onNext, nextLabel = "Continue", busy, disabled }) => (
  <div className="flex items-center justify-between pt-1">
    {previousTo ? (
      <Link
        to={previousTo}
        state={previousState}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft size={16} /> Previous
      </Link>
    ) : (
      <span />
    )}
    <button
      type="button"
      onClick={onNext}
      disabled={busy || disabled}
      className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Saving…
        </>
      ) : (
        <>
          {nextLabel} <ArrowRight size={16} />
        </>
      )}
    </button>
  </div>
);
