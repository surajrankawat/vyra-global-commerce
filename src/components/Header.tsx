import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { fetchNotifications, markNotificationAsRead } from '../lib/db';
import { AppNotification } from '../types';
import {
  Building2,
  ChevronDown,
  Plus,
  Bell,
  CheckCircle2,
  User,
  LogOut,
  Search,
  MessageSquare,
  HelpCircle,
  Sun,
  Moon,
  Globe,
  ShieldCheck,
  Activity,
  X,
  ShoppingBag,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenNewBusinessModal: () => void;
  onSelectView: (view: string) => void;
  onOpenLanding?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenNewBusinessModal,
  onSelectView,
  onOpenLanding,
  onOpenSearch,
}) => {
  const { user, currentBusiness, businesses, setCurrentBusiness, logout } = useAuth();
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { itemCount, openCart } = useCart();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showBizMenu, setShowBizMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Real backend health check state
  const [isSystemOnline, setIsSystemOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Check real backend health status
    const verifyHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsSystemOnline(data.status === 'ok');
        } else {
          setIsSystemOnline(false);
        }
      } catch (e) {
        setIsSystemOnline(false);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentBusiness) return;
    fetchNotifications(currentBusiness.id).then(setNotifications).catch(console.error);
  }, [currentBusiness]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    await markNotificationAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );
    if (notif.link) {
      onSelectView(notif.link);
      setShowNotifMenu(false);
    }
  };

  return (
    <header
      id="vyra-top-global-bar"
      className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs select-none"
    >
      {/* LEFT: Current Business, Business Status, Country */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            id="header-biz-selector-btn"
            type="button"
            onClick={() => setShowBizMenu(!showBizMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
          >
            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>

            <div className="max-w-[130px] sm:max-w-[200px] truncate">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                {currentBusiness?.name || 'Select Business'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {currentBusiness?.country || 'Global'}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* Business Dropdown Switcher */}
          {showBizMenu && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Active Enterprises ({businesses.length})
              </div>
              <div className="max-h-56 overflow-y-auto">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    id={`select-biz-${b.id}`}
                    type="button"
                    onClick={() => {
                      setCurrentBusiness(b);
                      setShowBizMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      currentBusiness?.id === b.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate">{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {b.business_type} · {b.country || 'Global'}
                      </div>
                    </div>
                    {b.is_demo && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold shrink-0">
                        SANDBOX
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowBizMenu(false);
                    onOpenNewBusinessModal();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Business
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Business Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>ACTIVE ENTERPRISE</span>
        </div>
      </div>

      {/* CENTER: Global Search / Command Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-slate-500 dark:text-slate-400">
              Search products, buyers, orders, markets...
            </span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-600 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* RIGHT: Status, Notifications, Messages, Help, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Live Systems Online Status (verified strictly against /api/health) */}
        {isSystemOnline === true && (
          <div
            title="Backend microservices & database online"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Online</span>
          </div>
        )}
        {isSystemOnline === false && (
          <div
            title="Backend service unreachable"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-mono font-bold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Systems Offline</span>
          </div>
        )}

        {/* Messages Shortcut */}
        <button
          type="button"
          onClick={() => onSelectView('chat')}
          title="Direct Commercial Inquiries & Chat"
          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        {/* Shopping Cart & B2C Checkout Trigger */}
        <button
          id="header-cart-btn"
          type="button"
          onClick={openCart}
          title="Shopping Cart & B2C Instant Checkout"
          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition relative"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
              {itemCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="header-notif-btn"
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition relative"
            title="Operational Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[10px] font-mono text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                        !notif.is_read ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {notif.title}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {notif.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        {/* Help Shortcut */}
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="VYRA Command Help & Documentation"
          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition hidden sm:block"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            id="header-user-menu-btn"
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <div className="w-6 h-6 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center font-mono">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {user?.full_name || 'Business Operator'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>RLS Tenant Isolation Active</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Enterprise Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onSelectView('launch-center');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  System Diagnostics
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                VYRA Global Business & Commerce Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong>Command Dock:</strong> Use the persistent action dock at the top of the dashboard to quickly create products, log buyer leads, issue quotations, and post RFQ tenders.
              </p>
              <p>
                <strong>Business Pipeline:</strong> Stages track commercial opportunities from requirement intake to fulfilled orders with real deal sizes.
              </p>
              <p>
                <strong>Action Queue:</strong> High-priority operational items needing response are prioritized on the right panel.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                Keyboard Shortcuts:
                <div className="mt-1">⌘K / Ctrl+K — Open Command Palette</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
