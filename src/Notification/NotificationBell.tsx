import React, { useState, useRef, useEffect } from "react";

import { useSelector } from "react-redux";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store";
import { IoMdNotificationsOutline } from "react-icons/io";
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
        className="p-2 rounded-full hover:bg-gray-100 cursor-pointer relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <IoMdNotificationsOutline size={25} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      

      {open && (
        <div className="absolute  right-0  mt-2 lg:w-96 w-60  bg-white border shadow-lg rounded z-50">
          <div className="p-3  border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">Notifications</span>
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-sm text-gray-600 underline"
              >
                {showAll ? "Show unseen only" :""}
              </button>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                navigate(getViewAllUrl());
              }}
              className="text-sm text-blue-600"
            >
              View all
            </button>
          </div>

          <div className="max-h-72 overflow-auto">
            {previewItems.length === 0 && (
              <div className="p-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center">
                  <p className="text-sm text-gray-500">
                    {showAll ? "No notifications." : "No unseen notifications."}
                  </p>
                </div>
              </div>
            )}

            {previewItems.map((n) => (
              <div
                key={n.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-start ${
                  !n.read ? "bg-gray-50" : "bg-white"
                }`}
                onClick={() => onClickNotif(n)}
              >
                <div className="flex-1 pr-3">
                  <div className="text-sm font-medium">{n.title}</div>

                  {/* Show message if present */}
                  <div className="text-xs text-gray-700 truncate flex items-center gap-2">
                    <img className="w-4 h-4 " src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1773254132/bell_horu2c.png" alt="" />
                    {(n.message.slice(0,45) || n.data?.message.slice(0,45)) + "..."}
                  </div>

                  <div className="text-[11px] text-gray-400 mt-1">
                    {fmtDate(n.created_at)}
                  </div>
                </div>

                {!n.read && (
                  <div className="ml-2 mt-1">
                    <span className="w-2 h-2 block rounded-full bg-red-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-2 border-t text-center">
            <button
              onClick={() => {
                setOpen(false);
                navigate(getOpenNotificationsUrl());
              }}
              className="text-sm text-blue-600 cursor-pointer"
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
