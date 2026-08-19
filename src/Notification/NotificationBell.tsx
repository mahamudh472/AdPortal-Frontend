import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store";
import { Bell } from "lucide-react";
import {
  markAsRead,
  type Notification,
} from "../features/auth/Context/notificationsSlice";
import { formatToLocalDateTime } from "../lib/dateUtils";

const NotificationBell: React.FC = () => {
  const unread = useSelector((s: RootState) => s.notifications.unreadCount);
  const allItems = useSelector((s: RootState) => s.notifications.items);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const userRole = useSelector((s: RootState) =>
    s.auth?.user?.is_admin ? "admin" : "user",
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    if (open) setShowAll(false);
  }, [open]);

  const fmtDate = (iso?: string) => {
    return formatToLocalDateTime(iso);
  };

  const previewItems = (
    showAll ? allItems : allItems.filter((i) => !i.read)
  ).slice(0, 20);

  const onClickNotif = (notif: Notification) => {
    if (!notif.read) {
      dispatch(markAsRead({ id: notif.id }));
    }
    setOpen(false);
    const url = notif.data?.url ?? notif.data?.redirect ?? undefined;
    if (url) navigate(url);
  };

  const getNotificationPageUrl = () => {
    return userRole === "admin"
      ? "/admin-dashboard/notifications"
      : "/user-dashboard/notifications";
  };

  const getViewAllUrl = () => {
    const baseUrl = getNotificationPageUrl();
    return showAll ? baseUrl : `${baseUrl}?filter=unseen`;
  };

  const getOpenNotificationsUrl = () => {
    return getNotificationPageUrl();
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="relative p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 lg:w-96 w-60 bg-white border border-slate-100 shadow-xl rounded-2xl z-50 overflow-hidden text-xs">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 text-xs">Notifications</span>
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-[11px] text-slate-500 hover:text-blue-600 underline"
              >
                {showAll ? "Show unseen only" : ""}
              </button>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                navigate(getViewAllUrl());
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {previewItems.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {showAll ? "No notifications." : "No unseen notifications."}
                </p>
              </div>
            )}

            {previewItems.map((n) => (
              <div
                key={n.id}
                className={`p-3 cursor-pointer hover:bg-slate-50 flex justify-between items-start transition-colors ${
                  !n.read ? "bg-blue-50/30" : "bg-white"
                }`}
                onClick={() => onClickNotif(n)}
              >
                <div className="flex-1 pr-3">
                  <div className="text-xs font-bold text-slate-900">{n.title}</div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    {(n.message.slice(0, 45) || n.data?.message.slice(0, 45)) + "..."}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {fmtDate(n.created_at)}
                  </div>
                </div>

                {!n.read && (
                  <div className="ml-2 mt-1">
                    <span className="w-2 h-2 block rounded-full bg-blue-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/50">
            <button
              onClick={() => {
                setOpen(false);
                navigate(getOpenNotificationsUrl());
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Open notifications page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
