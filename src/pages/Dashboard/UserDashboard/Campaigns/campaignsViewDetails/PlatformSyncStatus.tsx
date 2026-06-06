import React from "react";
import { formatToLocalDateTime } from "@/lib/dateUtils";

type PlatformSyncStatusProps = {
  syncStatuses?: Record<string, {
    operation: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    message: string;
    error_message: string | null;
    updated_at: string;
  }>;
};

const PlatformSyncStatus: React.FC<PlatformSyncStatusProps> = ({ syncStatuses }) => {
  if (!syncStatuses || Object.keys(syncStatuses).length === 0) return null;

  return (
    <div className="rounded-xl border bg-white p-6 mt-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
        Platform Sync Status
        <span className="text-xs font-normal text-slate-500">(Last updated status of each platform)</span>
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Object.entries(syncStatuses).map(([platform, sync]) => (
          <div key={platform} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">{platform}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  sync.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                  sync.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {sync.status}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {formatToLocalDateTime(sync.updated_at)}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-700">Operation:</span> {sync.operation}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-700">Message:</span> {sync.message}
              </p>
              {sync.error_message && (
                <div className="mt-2 rounded bg-red-50 p-2 text-[10px] text-red-800 break-words whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                  {sync.error_message}
                </div>
              )}
            </div>

            {sync.status === 'FAILED' && (
              <div className="mt-4 flex justify-end">
                <button 
                  className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                  onClick={() => alert(`Retrying sync for ${platform}...`)}
                >
                  <svg className="mr-1.5 h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Sync
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformSyncStatus;
