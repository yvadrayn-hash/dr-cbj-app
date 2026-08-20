"use client";

import { useEffect, useRef, useState } from "react";
import MarkNotificationRead from "@/components/MarkNotificationRead";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-teal-50"
        aria-label="Notifications"
        title="Notifications"
      >
        <span className="text-2xl">{"\u{1F514}"}</span>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-teal-900">
                Notifications
              </h2>

              <span className="text-xs text-gray-500">
                {unreadCount} unread
              </span>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No notifications.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-gray-100 p-4 last:border-b-0 ${
                    notification.isRead ? "bg-white" : "bg-teal-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-teal-900">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(
                          notification.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <MarkNotificationRead
                        notificationId={notification.id}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}