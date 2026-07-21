import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface NotificationObj {
  _id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationObj[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/wishlist/notifications');
      setNotifications(data.data);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/wishlist/notifications/read-all');
      toast.success('All marked as read.');
      fetchNotifications();
    } catch {
      toast.error('Failed to update notifications.');
    }
  };

  if (isLoading) {
    return (
      <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Notifications</h2>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-gold font-semibold hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 rounded-2xl border transition-all flex flex-col gap-1.5 ${n.isRead ? 'bg-card border-border' : 'bg-gold/5 border-gold/20 shadow-sm'}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{n.title}</h4>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
