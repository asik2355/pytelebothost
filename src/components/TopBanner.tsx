import React, { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Bell,
  User,
  Menu,
  X,
  CreditCard,
  Home,
  Server,
  ShoppingBag,
  Terminal,
  Globe,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  RotateCw,
  Wallet,
  ExternalLink,
  Layers,
  Sparkles,
  Trash2,
  CheckCheck,
  PlusCircle,
  FileText,
  LogOut,
} from "lucide-react";
import { WorkspaceStatus, AppNotification } from "../types";

interface TopBannerProps {
  lang: "bn" | "en";
  setLang: (lang: "bn" | "en") => void;
  status: WorkspaceStatus | null;
  walletBalance?: number;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onStartBot: () => void;
  onStopBot: () => void;
  onRestartBot: () => void;
  notifications: AppNotification[];
  onMarkAllNotificationsRead: () => void;
  onClearNotifications: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  lang,
  setLang,
  status,
  walletBalance = 117.50,
  currentRoute,
  onNavigate,
  onStartBot,
  onStopBot,
  onRestartBot,
  notifications,
  onMarkAllNotificationsRead,
  onClearNotifications,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isRunning = status?.status === "running";
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatNotificationTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return lang === "bn" ? "এইমাত্র" : "Just now";
      if (diffMins < 60) return lang === "bn" ? `${diffMins} মি আগে` : `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return lang === "bn" ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
      return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonitorClick = () => {
    if (currentRoute !== "/home") {
      onNavigate("/home");
      setTimeout(() => {
        const el = document.getElementById("terminal-logs-card") || document.getElementById("bot-workspace-runner");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById("terminal-logs-card") || document.getElementById("bot-workspace-runner");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      id="permanent-top-banner"
      className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-slate-200/90 shadow-2xs select-none"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-11 sm:h-12 flex items-center justify-between gap-3">
        {/* LEFT: Zero-Bot Logo & Brand */}
        <div
          onClick={() => onNavigate("/home")}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
          title="Zero-Bot Home"
        >
          {/* Custom Zero-Bot Circular Logo */}
          <div className="relative w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0">
            {/* Multi-color arc rings matching screenshot */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cyan Arc (Top-Left) */}
              <circle
                cx="22"
                cy="22"
                r="19"
                stroke="url(#cyan-grad)"
                strokeWidth="3.2"
                strokeDasharray="45 75"
                strokeDashoffset="15"
                strokeLinecap="round"
              />
              {/* Magenta/Pink Arc (Bottom-Right) */}
              <circle
                cx="22"
                cy="22"
                r="19"
                stroke="url(#magenta-grad)"
                strokeWidth="3.2"
                strokeDasharray="40 80"
                strokeDashoffset="-50"
                strokeLinecap="round"
              />
              {/* Inner Soft Circle */}
              <circle cx="22" cy="22" r="14.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

              <defs>
                <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="magenta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Letter Z */}
            <span className="relative z-10 font-bold text-xs sm:text-sm text-slate-700 tracking-tight font-sans">
              Z
            </span>
          </div>

          {/* Zero-Bot Text */}
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-sans group-hover:text-sky-600 transition-colors">
            Zero-Bot
          </span>
        </div>

        {/* RIGHT: Action Icons matching screenshot */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Money Logo & Current User Balance (Beside Notifications) */}
          <button
            id="banner-wallet-balance-btn"
            type="button"
            onClick={() => onNavigate("/billing")}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 h-8 sm:h-8.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 hover:bg-emerald-100 active:scale-95 text-emerald-950 transition-all shadow-2xs cursor-pointer group"
            title={
              lang === "bn"
                ? `বর্তমান ব্যালেন্স: ৳${walletBalance.toFixed(2)} (টাকা যোগ করতে ক্লিক করুন)`
                : `Current Balance: ৳${walletBalance.toFixed(2)} (Click to recharge)`
            }
          >
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-2xs font-extrabold text-[11px] group-hover:scale-105 transition-transform shrink-0">
              ৳
            </div>
            <div className="flex flex-col items-start leading-none pr-0.5">
              <span className="font-mono font-bold text-xs sm:text-xs text-emerald-900 tracking-tight">
                ৳{walletBalance.toFixed(2)}
              </span>
            </div>
          </button>

          {/* 2. Notification Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              id="banner-bell-btn"
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen && unreadCount > 0) {
                  onMarkAllNotificationsRead();
                }
              }}
              className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-700 transition-colors relative"
              title={lang === "bn" ? "নোটিফিকেশন" : "Notifications"}
            >
              <Bell className="w-4.5 h-4.5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 bg-rose-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center ring-1.5 ring-white animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 top-11 bg-black/20 z-40 sm:hidden"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="fixed left-3 right-3 top-[50px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-96 sm:mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {lang === "bn" ? "নোটিফিকেশন" : "Notifications"}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-1.5 py-0.2 rounded-full">
                      {notifications.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                        title={lang === "bn" ? "সব পঠিত হিসেবে চিহ্নিত করুন" : "Mark all as read"}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{lang === "bn" ? "সব পঠিত" : "Mark read"}</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors"
                        title={lang === "bn" ? "নোটিফিকেশন মুছুন" : "Clear all"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === "bn" ? "মুছুন" : "Clear"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <Bell className="w-8 h-8 text-slate-300 stroke-1" />
                      <p>{lang === "bn" ? "কোনো নোটিফিকেশন নেই।" : "No notifications yet."}</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isDeposit = n.type === "deposit";
                      const isPlan = n.type === "plan";
                      const isBot = n.type === "bot";

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.link) {
                              setIsNotificationsOpen(false);
                              onNavigate(n.link);
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-colors flex items-start gap-2.5 text-xs cursor-pointer border ${
                            !n.read
                              ? "bg-sky-50/40 border-sky-100 hover:bg-sky-50/80"
                              : "bg-slate-50/40 border-slate-100/70 hover:bg-slate-100/70"
                          }`}
                        >
                          {/* Icon based on notification category */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                              isDeposit
                                ? "bg-emerald-100 text-emerald-700"
                                : isPlan
                                ? "bg-indigo-100 text-indigo-700"
                                : isBot
                                ? "bg-amber-100 text-amber-700"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {isDeposit ? (
                              <Wallet className="w-4 h-4" />
                            ) : isPlan ? (
                              <Layers className="w-4 h-4" />
                            ) : isBot ? (
                              <Terminal className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-slate-900 truncate">
                                {lang === "bn" ? n.titleBn || n.title : n.title}
                              </p>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                              {lang === "bn" ? n.descBn || n.desc : n.desc}
                            </p>
                            <div className="flex items-center justify-between mt-1 pt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatNotificationTime(n.timestamp)}
                              </span>
                              {isDeposit && n.amount && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  +৳{n.amount.toFixed(2)}
                                </span>
                              )}
                              {isPlan && n.planName && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  {n.planName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

          {/* 3. Circular Gradient User Avatar */}
          <div className="relative" ref={profileRef}>
            <button
              id="banner-avatar-btn"
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 flex items-center justify-center text-white shadow-2xs ring-1.5 ring-white transition-all"
              title="User Profile & Wallet"
            >
              <User className="w-4 h-4 text-white" />
            </button>

            {/* User Profile / Wallet Popover matching user screenshot */}
            {isProfileOpen && (
              <>
                {/* Mobile Backdrop */}
                <div
                  className="fixed inset-0 top-11 bg-black/20 z-40 sm:hidden"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="fixed left-3 right-3 top-[50px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-[320px] sm:mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Header */}
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Alif Sheikh</h3>
                    <p className="text-xs text-slate-500 mt-0.5 select-all font-sans">
                      asikgamerbd@gmail.com
                    </p>
                  </div>

                  {/* Balance Gray Card - Single Line */}
                  <div className="my-3 px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Balance
                    </span>
                    <span className="text-base font-extrabold text-slate-900 font-sans tracking-tight">
                      ৳{walletBalance.toFixed(2)}
                    </span>
                  </div>

                  {/* Actions List */}
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate("/billing");
                      }}
                      className="w-full text-left py-2 px-1.5 rounded-lg text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-colors flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-500 stroke-[1.8]" />
                      <span>Add Funds</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate("/billing");
                      }}
                      className="w-full text-left py-2 px-1.5 rounded-lg text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-colors flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500 stroke-[1.8]" />
                      <span>Invoices</span>
                    </button>
                  </div>

                  {/* Sign Out Row */}
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left py-1.5 px-1.5 rounded-lg text-rose-500 hover:bg-rose-50 active:scale-[0.99] transition-colors flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 stroke-[1.8]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 4. Hamburger Menu Icon */}
          <div className="relative" ref={menuRef}>
            <button
              id="banner-menu-btn"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-xl hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-700 transition-colors"
              title="Quick Menu"
            >
              {isMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick Slide-down Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">
                  Navigation
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onNavigate("/home");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors ${
                      currentRoute === "/home"
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>HOME</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onNavigate("/services");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors ${
                      currentRoute === "/services"
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Server className="w-4 h-4" />
                    <span>SERVICE</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onNavigate("/billing");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors ${
                      currentRoute === "/billing"
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>BILLING</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onNavigate("/bot-store");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors ${
                      currentRoute === "/bot-store"
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>BOT STORE</span>
                  </button>
                </div>

                {/* Quick Bot Actions in Menu */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
                    Bot Controller
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {isRunning ? (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onStopBot();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onStartBot();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRestartBot();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                  </div>
                </div>

                {/* Language Switch */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setLang(lang === "bn" ? "en" : "bn");
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>{lang === "bn" ? "ভাষা পরিবর্তন" : "Switch Language"}</span>
                    </span>
                    <span className="font-bold text-sky-600">
                      {lang === "bn" ? "English" : "বাংলা"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
