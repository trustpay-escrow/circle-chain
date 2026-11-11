'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Coins,
  Gift,
  Gavel,
  RefreshCw,
  AlertTriangle,
  Clock,
  Users,
  Shield,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  NotificationData
} from '../lib/api';
import { useWallet } from '../lib/wallet-context';

export function NotificationsPopover() {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!address) {
      setNotifications([]);
      return;
    }
    try {
      const data = await fetchNotificationsApi(address);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [address]);

  // Initial load + periodic polling every 15s
  useEffect(() => {
    loadNotifications();
    if (!address) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [address, loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationReadApi(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!address) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsReadApi(address);
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payout_released':
      case 'bid_win':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
        );
      case 'cycle_pay':
        return (
          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
        );
      case 'bid':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Gavel className="w-4 h-4" />
          </div>
        );
      case 'shuffled':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
        );
      case 'slashed':
      case 'defaulted':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'contribution_due':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'joined':
      case 'circle_created':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  if (!address) return null;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-white">Activity Alerts</span>
              {unreadCount > 0 && (
                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">No activity alerts yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  You will receive real-time alerts when cycle contributions, pot payouts, or auction bids happen.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/circles/${n.circle_id}`}
                  onClick={() => {
                    if (!n.is_read) handleMarkAsRead(n.id);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-3 flex items-start space-x-3 transition-colors hover:bg-slate-900/80 ${
                    !n.is_read ? 'bg-slate-900/40' : ''
                  }`}
                >
                  {getNotificationIcon(n.notification_type)}

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`text-xs ${!n.is_read ? 'text-white font-medium' : 'text-slate-300'} line-clamp-2`}>
                      {n.message}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                      <span>Circle #{String(n.circle_id)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(n.created_at)}</span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500">
                Live Soroban On-Chain Indexer Sync
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
