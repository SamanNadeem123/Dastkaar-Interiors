import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminTopbar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useAdminNotifications();

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-charcoal/10 bg-ivory-100/95 px-6 backdrop-blur-md lg:px-10">
      <h1 className="font-display text-xl font-medium text-charcoal">{title}</h1>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={() => setOpen((v) => !v)}
            className="relative rounded-full p-2 text-charcoal/70 transition-colors hover:bg-sand-light hover:text-walnut"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-3 w-80 rounded-card border border-charcoal/10 bg-ivory-100 shadow-lift">
              <div className="flex items-center justify-between border-b border-charcoal/10 px-4 py-3">
                <span className="text-sm font-semibold text-charcoal">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead()} className="text-xs font-medium text-walnut hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-charcoal/50">No notifications yet.</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markRead(n.id);
                      if (n.related_order_id) navigate(`/admin/orders/${n.related_order_id}`);
                      setOpen(false);
                    }}
                    className={`block w-full border-b border-charcoal/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-sand-light ${
                      !n.is_read ? "bg-sand-light/50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-charcoal">{n.title}</p>
                    <p className="mt-0.5 text-xs text-charcoal/60">{n.message}</p>
                    <p className="mt-1 text-[11px] text-charcoal/40">{timeAgo(n.created_at)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-charcoal">{user?.full_name}</p>
          <p className="text-xs text-charcoal/50">Administrator</p>
        </div>
      </div>
    </header>
  );
}
