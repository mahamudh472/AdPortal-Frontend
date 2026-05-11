import React, { useRef, useState } from "react";
import { Link } from "react-router";

type AdMatrics = {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
  cpc: number;
  cpm: number;
  cpa: number;
};

type Ad = {
  id: number;
  ad_name: string;
  headline: string;
  primary_text: string;
  description: string;
  call_to_action: string;
  destination_url: string;
  file_url?: string; // Add file_url field
  assets?: Array<{
    id: number;
    file_url: string;
    file_type: string;
    status: string;
  }>;
  matrics?: AdMatrics;
  type?: "Image" | "Video"; // We'll derive this from file_url
};

type Campaign = {
  id: number;
  name: string;
  objective: string;
  platforms: string[];
  matrics: AdMatrics;
  ads: Ad[];
  audience_targeting: {
    min_age: number;
    max_age: number;
    gender: string;
    locations: string[];
    keywords: string;
  };
  status: string;
  created_at: string;
  ai_insights: unknown[];
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  budgets: Array<{
    platform: string;
    budget_type: string;
    start_date: string;
    end_date: string;
    budget: number;
    run_continuously: boolean;
  }>;
  file_url?: string; // Campaign level file_url
};

type CreativePerformanceProps = {
  campaign: Campaign;
};

// Helper function to determine media type from file_url
const getMediaType = (fileUrl?: string): "Image" | "Video" => {
  if (!fileUrl) return "Image";
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const fileExt = fileUrl.substring(fileUrl.lastIndexOf('.')).toLowerCase();
  
  return videoExtensions.includes(fileExt) ? "Video" : "Image";
};

// Video player with manual play button
const VideoPlayer: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <div
      className="relative h-40 w-full bg-black rounded-lg overflow-hidden cursor-pointer"
      onClick={togglePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-cover"
        muted
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Play/Pause overlay */}
      {(!playing || hovered) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            {playing ? (
              <svg className="h-5 w-5 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-slate-800 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Mute/Unmute button — bottom right */}
      <button
        onClick={toggleMute}
        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          /* Muted icon */
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          /* Unmuted icon */
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </div>
  );
};



const getFileName = (fileUrl?: string): string => {
  if (!fileUrl) return "";
  return fileUrl.split('/').pop() || "";
};

const CreativePerformance: React.FC<CreativePerformanceProps> = ({ campaign }) => {
  return (
    <div className="rounded-xl border bg-white p-6">
      {/* Header */}
      <h2 className="mb-4 text-sm font-semibold text-slate-900">
        Creative Performance
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaign.ads && campaign.ads.length > 0 ? (
          campaign.ads.map((item) => {
            // Use ad-level file_url, fallback to first asset's file_url, then campaign-level file_url
            const fileUrl = item.file_url || (item.assets && item.assets.length > 0 ? item.assets[0].file_url : null) || campaign.file_url;
            const mediaType = getMediaType(fileUrl);
            const fileName = getFileName(fileUrl);

            return (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-3 hover:shadow-lg transition-shadow"
              >
                {/* Image/Video */}
                <div className="relative mb-3 w-full overflow-hidden rounded-lg bg-slate-100">
                  {mediaType === "Image" ? (
                    <img
                      src={fileUrl || "https://placehold.co/400x200?text=No+Image"}
                      alt={item.headline || item.ad_name}
                      className="h-40 w-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = "https://placehold.co/400x200?text=Image+Error";
                      }}
                    />
                  ) : (
                    <VideoPlayer src={fileUrl!} />
                  )}

                  {/* Media Type Badge */}
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
                    {mediaType}
                  </span>

                  {/* File name tooltip (optional) */}
                  {fileName && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white opacity-0 hover:opacity-100 transition-opacity">
                      {fileName}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
                      {item.headline || item.ad_name}
                    </h3>
                    <Link 
                      to={`/user-dashboard/campaigns-update/${campaign.id}`}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit Ad"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {item.primary_text || item.description || ""}
                  </p>
                  
                  {/* CTA and Destination URL */}
                  {item.call_to_action && (
                    <div className="mt-2">
                      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        {item.call_to_action}
                      </span>
                    </div>
                  )}
                  
                  {item.destination_url && (
                    <a 
                      href={item.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {item.destination_url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">
                      Impressions
                    </p>
                    <p className="font-medium text-slate-900">
                      {item.matrics?.impressions?.toLocaleString() ?? "0"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Clicks</p>
                    <p className="font-medium text-slate-900">
                      {item.matrics?.clicks?.toLocaleString() ?? "0"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">CTR</p>
                    <p className="font-medium text-green-600">
                      {item.matrics?.ctr ? `${item.matrics.ctr}%` : "0%"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Conversions
                    </p>
                    <p className="font-medium text-slate-900">
                      {item.matrics?.conversions?.toLocaleString() ?? "0"}
                    </p>
                  </div>
                </div>

                {/* Additional Metrics (optional) */}
                {(item.matrics?.cpc !== undefined || item.matrics?.cpm !== undefined) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    {item.matrics?.cpc !== undefined && (
                      <div>
                        <p className="text-slate-500">CPC</p>
                        <p className="font-medium text-slate-900">${item.matrics.cpc}</p>
                      </div>
                    )}
                    {item.matrics?.cpm !== undefined && (
                      <div>
                        <p className="text-slate-500">CPM</p>
                        <p className="font-medium text-slate-900">${item.matrics.cpm}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
              <div className="mb-4 text-slate-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="mx-auto"
                >
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="9" y1="2" x2="9" y2="22"></line>
                  <line x1="15" y1="2" x2="15" y2="22"></line>
                  <line x1="2" y1="9" x2="22" y2="9"></line>
                  <line x1="2" y1="15" x2="22" y2="15"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">No Creatives Found</h3>
              <p className="mt-2 text-sm text-slate-500">
                You haven't uploaded any creatives for this campaign. Create one to get started.
              </p>
              
              {/* Campaign Info */}
              <div className="mt-6 text-xs text-slate-400">
                <p>Campaign: {campaign.name}</p>
                <p>Status: {campaign.status}</p>
                <p>Platforms: {campaign.platforms.join(', ')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativePerformance;