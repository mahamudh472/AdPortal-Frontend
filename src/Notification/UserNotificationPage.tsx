// src/pages/NotificationsPage.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  type Notification,
  selectAllNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectNotificationsPagination
} from "../features/auth/Context/notificationsSlice";
import { Bell, CheckCheck, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { parseUTCDate } from "../lib/dateUtils";

const UserNotificationPage: React.FC = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationsLoading);
  const pagination = useSelector(selectNotificationsPagination);

  const [markingAll, setMarkingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "seen" | "unseen">("all");

  const filteredItems =
    filter === "seen"
      ? items.filter((i) => i.read)
      : filter === "unseen"
        ? items.filter((i) => !i.read)
        : items;

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, pageSize: 10 }) as any);
  }, [dispatch]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    dispatch(fetchNotifications({ page, pageSize: 10 }) as any);
  };


  const fmtDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const date = parseUTCDate(iso);
      if (!date) return "";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      dispatch(markAsRead({ id: notif.id }) as any);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    
    setMarkingAll(true);
    try {
      await dispatch(markAllAsRead() as any);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) return;
    
    setDeletingAll(true);
    try {
      await dispatch(deleteAllNotifications() as any);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await dispatch(deleteNotification({ id }) as any);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };




  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Notifications</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {unreadCount} unread • {pagination.count} total
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                {(["all", "seen", "unseen"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium capitalize transition-colors ${
                      filter === f
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {items.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm("all")}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Delete all</span>
                  <span className="xs:hidden">Delete</span>
                </button>
              )}
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-xs sm:text-sm font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {markingAll ? "Marking..." : <><span className="hidden sm:inline">Mark all read</span><span className="sm:hidden">Mark read</span></>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete All Confirmation Modal */}
        {showDeleteConfirm === "all" && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            
            <div className="bg-white rounded-xl  max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete all notifications?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone. All notifications will be permanently deleted.</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center gap-2"
                >
                  {deletingAll ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete all"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Single Confirmation Modal */}
        {showDeleteConfirm && showDeleteConfirm !== "all" && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete notification?</h3>
              <p className="text-gray-600 mb-6">This notification will be permanently deleted.</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSingle(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500">We'll notify you when something new arrives.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((n) => {
              const isRead = n.read;
              return (
                <div 
                  key={n.id}
                  className={`
                    bg-white rounded-xl shadow-sm p-5 relative group
                    transition-all duration-200 hover:shadow-md
                    ${!isRead ? 'border-l-4 border-blue-500' : 'border-l-4 border-transparent'}
                  `}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(n.id);
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div 
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => handleClick(n)}
                  >
                    {!isRead && (
                      <div className="flex-shrink-0 mt-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full block"></span>
                      </div>
                    )}

                    
                    <div className="flex-1 min-w-0 pr-8">
                      <p className={`text-gray-900 mb-2 ${!isRead ? 'font-medium' : ''}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmtDate(n.created_at)}
                      </p>
                    </div>


                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm px-5 py-3">
            <p className="text-sm text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages}
              <span className="ml-2 text-gray-400">({pagination.count} total)</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.previous || loading}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Sliding window: show only current page ± 2 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p =>
                    p >= Math.max(1, pagination.currentPage - 2) &&
                    p <= Math.min(pagination.totalPages, pagination.currentPage + 2)
                  )
                  .map(p => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === pagination.currentPage
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
              </div>
             

              <button
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.next || loading}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotificationPage;