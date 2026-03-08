import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationApi, type Notification } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const NOTIFICATION_ICONS: Record<string, string> = {
    profile_approved: "✅",
    profile_rejected: "❌",
    new_inquiry: "💬",
    new_review: "⭐",
    verification_complete: "🔒",
    admin_announcement: "📢",
    profile_featured: "🌟",
};

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const result = await notificationApi.getUnreadCount();
            setUnreadCount(result.count);
        } catch {
            // Silently fail — notifications are not critical
        }
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoadingNotifications(true);
        try {
            const data = await notificationApi.getAll(20);
            setNotifications(data);
        } catch {
            // Silently fail
        } finally {
            setLoadingNotifications(false);
        }
    }, [user]);

    // Poll unread count every 30s
    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    // Fetch full list when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // Silently fail
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            // Silently fail
        }
    };

    if (!user) return null;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    data-testid="button-notification-bell"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {loadingNotifications ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No notifications yet
                    </div>
                ) : (
                    <div className="py-1">
                        {notifications.map((n) => (
                            <button
                                key={n.id}
                                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 ${!n.is_read ? "bg-primary/5" : ""
                                    }`}
                                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                            >
                                <span className="text-lg flex-shrink-0 mt-0.5">
                                    {NOTIFICATION_ICONS[n.type] || "🔔"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-sm leading-tight ${!n.is_read ? "font-semibold" : ""
                                            }`}
                                    >
                                        {n.title}
                                    </p>
                                    {n.message && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {n.message}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {timeAgo(n.created_at)}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
