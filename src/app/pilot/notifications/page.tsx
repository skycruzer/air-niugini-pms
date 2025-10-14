'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pilotAuthService, type PilotAuthUser } from '@/lib/pilot-auth-utils';
import {
  getPilotNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationColor,
  type Notification,
} from '@/lib/pilot-notifications-service';
import {
  Bell,
  CheckCheck,
  Filter,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  CalendarX,
  Heart,
  Megaphone,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function PilotNotificationsPage() {
  const [pilotUser, setPilotUser] = useState<PilotAuthUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const user = await pilotAuthService.getSession();
      setPilotUser(user);

      if (user?.id) {
        await loadNotifications(user.id);
      }
    };
    loadUser();
  }, []);

  const loadNotifications = async (userId: string) => {
    setIsLoading(true);
    const filters = filter === 'unread' ? { unreadOnly: true } : {};
    const notifs = await getPilotNotifications(userId, filters);
    setNotifications(notifs);

    const count = await getUnreadCount(userId);
    setUnreadCount(count);
    setIsLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    if (success && pilotUser?.id) {
      await loadNotifications(pilotUser.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!pilotUser?.id) return;
    const success = await markAllNotificationsAsRead(pilotUser.id);
    if (success) {
      await loadNotifications(pilotUser.id);
    }
  };

  const handleFilterChange = async (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    if (pilotUser?.id) {
      setIsLoading(true);
      const filters = newFilter === 'unread' ? { unreadOnly: true } : {};
      const notifs = await getPilotNotifications(pilotUser.id, filters);
      setNotifications(notifs);
      setIsLoading(false);
    }
  };

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'leave_request_submitted':
        return <Calendar className="w-5 h-5" />;
      case 'leave_request_approved':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'leave_request_rejected':
        return <XCircle className="w-5 h-5" />;
      case 'leave_request_cancelled':
        return <CalendarX className="w-5 h-5" />;
      case 'post_reply':
        return <MessageSquare className="w-5 h-5" />;
      case 'post_liked':
        return <Heart className="w-5 h-5" />;
      case 'system_announcement':
        return <Megaphone className="w-5 h-5" />;
      case 'certification_expiring':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: string) => {
    const color = getNotificationColor(type);
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    };
    return colorMap[color] || colorMap.gray;
  };

  if (!pilotUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn btn-ghost border-gray-300">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 border-t border-gray-200 pt-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner-lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const colors = getColorClasses(notification.type);
            const NotificationContent = (
              <div
                className={`bg-white rounded-xl shadow-md p-4 border transition-all hover:shadow-lg ${
                  notification.is_read === false ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  {/* Icon */}
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${colors.text}`}>
                    {getIconComponent(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {notification.is_read === false && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-2" />
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {notification.created_at && new Date(notification.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {notification.is_read === false && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleMarkAsRead(notification.id);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );

            // Wrap with Link if there's a link
            if (notification.link) {
              return (
                <Link key={notification.id} href={notification.link}>
                  {NotificationContent}
                </Link>
              );
            }

            return <div key={notification.id}>{NotificationContent}</div>;
          })
        )}
      </div>
    </div>
  );
}
