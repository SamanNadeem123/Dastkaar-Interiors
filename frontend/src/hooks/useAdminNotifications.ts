import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { adminNotificationsApi } from "../services/admin";
import { connectAdminSocket } from "../services/socket";

interface NewOrderEvent {
  order_number: string;
  customer_name: string;
  total: number;
  payment_method: string;
  order_id: number;
}

export function useAdminNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => adminNotificationsApi.list(1, 15),
    enabled: isAdmin,
    refetchInterval: 60_000, // fallback poll in case a socket event is ever missed
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => adminNotificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => adminNotificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  // Real-time: whenever a customer places a new order, the backend pushes
  // "new_order" to the admin room over Socket.IO. We surface a toast and
  // refresh the notification list/unread badge immediately, without polling.
  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    const socket = connectAdminSocket(accessToken);

    const handleNewOrder = (event: NewOrderEvent) => {
      toast.success(
        `New order ${event.order_number} from ${event.customer_name} — PKR ${event.total.toLocaleString()}`,
        { duration: 6000 }
      );
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    };

    const handleCountUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    };

    socket.on("new_order", handleNewOrder);
    socket.on("notification_count_update", handleCountUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("notification_count_update", handleCountUpdate);
    };
  }, [isAdmin, accessToken, queryClient]);

  return {
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    isLoading: query.isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
