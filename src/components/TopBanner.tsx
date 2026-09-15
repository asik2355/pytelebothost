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
  LayoutGrid,
  Activity,
  ShoppingCart,
  Bot,
  Ticket,
  UserPlus,
  Gift,
  Settings,
  ChevronRight,
  Copy,
  Check,
  LogIn,
} from "lucide-react";
import { WorkspaceStatus, AppNotification, AuthUser } from "../types";
import { VpsConnectionModal } from "./VpsConnectionModal";
import { getVpsApiBaseUrl } from "../lib/api";

interface TopBannerProps {
  lang: "bn" | "en";
  setLang: (lang: "bn" | "en") => void;
  status: WorkspaceStatus | null;
  walletBalance?: number;
  currentRoute: string;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
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
  walletBalance = 0.00,
  currentRoute,
  currentUser,
  onSignOut,
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
  const [activeModal, setActiveModal] = useState<
    null | "help" | "rewards" | "settings"
  >(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

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
        {/* LEFT: Host Bot Logo & Brand */}
        <div
          onClick={() => onNavigate("/home")}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
          title="Host Bot Home"
        >
          {/* Official Host Bot Logo Image */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform duration-200">
            <img
              src="/logo.svg?v=3"
              alt="Host Bot Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Host Bot Text */}
          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-sans group-hover:text-indigo-600 transition-colors">
            Host Bot
          </span>
        </div>

        {/* RIGHT: Action Icons matching screenshot */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <>
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
                  className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-700 transition-colors relative cursor-pointer"
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
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 flex items-center justify-center text-white shadow-2xs ring-1.5 ring-white transition-all cursor-pointer"
                  title={`${currentUser.name} (${currentUser.email})`}
                >
                  {currentUser.name ? (
                    <span className="text-xs font-bold uppercase">
                      {currentUser.name.charAt(0)}
                    </span>
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* User Profile / Wallet Popover */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 top-11 bg-black/20 z-40 sm:hidden"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="fixed left-3 right-3 top-[50px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-[320px] sm:mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                            {currentUser.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 select-all font-sans truncate">
                            {currentUser.email}
                          </p>
                          {currentUser.telegramUsername && (
                            <span className="inline-block mt-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100">
                              {currentUser.telegramUsername}
                            </span>
                          )}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0 uppercase border border-indigo-100">
                          {currentUser.name.charAt(0)}
                        </div>
                      </div>

                      <div className="my-3 px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Balance
                        </span>
                        <span className="text-base font-extrabold text-slate-900 font-sans tracking-tight">
                          ৳{walletBalance.toFixed(2)}
                        </span>
                      </div>

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

                      <div className="border-t border-slate-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onSignOut) {
                              onSignOut();
                            } else {
                              onNavigate("/login");
                            }
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
            </>
          ) : (
            /* Guest State */
            currentRoute !== "/login" && currentRoute !== "/registration" ? (
              <button
                type="button"
                onClick={() => onNavigate("/login")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === "bn" ? "লগইন" : "Sign In"}</span>
              </button>
            ) : null
          )}

          {/* 4. Hamburger Menu Icon */}
          <div className="relative">
            <button
              id="banner-menu-btn"
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 rounded-xl hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              title="Services Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Full Left Slide-in Drawer matching user screenshot */}
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-in fade-in duration-200"
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Left Drawer Container */}
                <div
                  ref={menuRef}
                  className="fixed top-0 left-0 bottom-0 w-[285px] max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
                >
                  {/* Brand Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {/* Stylized Host Bot logo icon */}
                      <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                        <img
                          src="/logo.svg?v=3"
                          alt="Host Bot Logo"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-base tracking-tight font-sans block">
                          Host Bot
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          bot-host.xyz
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Menu Body */}
                  <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 py-1.5">
                      SERVICES
                    </div>

                    {/* 1. Console Hub */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate("/home");
                      }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        currentRoute === "/home"
                          ? "bg-[#f2effe] text-[#5a36db] font-semibold relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#5a36db] before:rounded-r"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <LayoutGrid
                        className={`w-5 h-5 ${
                          currentRoute === "/home" ? "text-[#6342db]" : "text-slate-600"
                        }`}
                      />
                      <span>Console Hub</span>
                    </button>

                    {/* 2. My Server */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate("/my-servers");
                      }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        currentRoute === "/my-servers"
                          ? "bg-[#f2effe] text-[#5a36db] font-semibold relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#5a36db] before:rounded-r"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Server
                        className={`w-5 h-5 ${
                          currentRoute === "/my-servers" ? "text-[#6342db]" : "text-slate-600"
                        }`}
                      />
                      <span>My Server</span>
                    </button>

                    {/* 3. Hosting Plans (Active state highlighted matching screenshot) */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate("/services");
                      }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        currentRoute === "/services"
                          ? "bg-[#f2effe] text-[#5a36db] font-semibold relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#5a36db] before:rounded-r"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <ShoppingCart
                        className={`w-5 h-5 ${
                          currentRoute === "/services" ? "text-[#6342db]" : "text-slate-600"
                        }`}
                      />
                      <span>Hosting Plans</span>
                    </button>

                    {/* 4. Bot Code Store */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate("/bot-store");
                      }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        currentRoute === "/bot-store"
                          ? "bg-[#f2effe] text-[#5a36db] font-semibold relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#5a36db] before:rounded-r"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Bot
                        className={`w-5 h-5 ${
                          currentRoute === "/bot-store" ? "text-[#6342db]" : "text-slate-600"
                        }`}
                      />
                      <span>Bot Code Store</span>
                    </button>

                    {/* 5. Help Center */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setActiveModal("help");
                      }}
                      className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Ticket className="w-5 h-5 text-slate-600" />
                      <span>Help Center</span>
                    </button>

                    {/* 6. Referral Program */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate("/referral");
                      }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        currentRoute === "/referral"
                          ? "bg-[#f2effe] text-[#5a36db] font-semibold relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#5a36db] before:rounded-r"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <UserPlus
                        className={`w-5 h-5 ${
                          currentRoute === "/referral" ? "text-[#6342db]" : "text-slate-600"
                        }`}
                      />
                      <span>Referral Program</span>
                    </button>

                    {/* 7. Claim Rewards */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setActiveModal("rewards");
                      }}
                      className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Gift className="w-5 h-5 text-slate-600" />
                      <span>Claim Rewards</span>
                    </button>

                    {/* 8. VPS API Connection Manager */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setActiveModal("vps");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Server className="w-5 h-5 text-indigo-600" />
                        <span>VPS API Connection</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">
                        {getVpsApiBaseUrl() ? "CUSTOM VPS" : "VERCEL PROXY"}
                      </span>
                    </button>

                    {/* 9. Account Settings / Login */}
                    {currentUser ? (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setActiveModal("settings");
                        }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <Settings className="w-5 h-5 text-slate-600" />
                        <span>Account Settings</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigate("/login");
                        }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer"
                      >
                        <User className="w-5 h-5 text-indigo-600" />
                        <span>Sign In / Register</span>
                      </button>
                    )}
                  </div>

                  {/* Footer in Drawer */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setLang(lang === "bn" ? "en" : "bn");
                      }}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>{lang === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন"}</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">v2.5.0</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Modals for Menu Items */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            {/* Modal: Help Center */}
            {activeModal === "help" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Help Center & Support</h3>
                      <p className="text-xs text-slate-400">24/7 Live Support Support Team</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Telegram Support</span>
                      <span className="text-slate-500 text-[11px]">@BotHostSupportBD</span>
                    </div>
                    <a
                      href="https://t.me"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-semibold text-[11px]"
                    >
                      Join
                    </a>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Email Support</span>
                      <span className="text-slate-500 text-[11px]">support@bot-host.xyz</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">Active</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            )}

            {/* Modal: Claim Rewards */}
            {activeModal === "rewards" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Claim Daily Rewards</h3>
                      <p className="text-xs text-slate-400">Daily Login & Activity Bonuses</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200/80 text-center space-y-2">
                  <span className="text-2xl">🎁</span>
                  <h4 className="font-bold text-amber-950 text-sm">Daily Hosting Bonus</h4>
                  <p className="text-xs text-amber-800">
                    Claim your daily ৳5.00 server hosting credit every 24 hours!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRewardClaimed(true);
                  }}
                  disabled={rewardClaimed}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    rewardClaimed
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white cursor-pointer shadow-md"
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>{rewardClaimed ? "Reward Claimed Today (৳5.00)" : "Claim ৳5.00 Bonus Now"}</span>
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}

            {/* Modal: Account Settings */}
            {activeModal === "settings" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Account Settings</h3>
                      <p className="text-xs text-slate-400">Manage Profile & Security</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.name || "Alif Sheikh"}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Email Address</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.email || "asikgamerbd@gmail.com"}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Currency</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium">
                      <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                      <option value="USD">USD ($) - US Dollar</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VPS API Connection Manager Modal */}
      <VpsConnectionModal
        isOpen={activeModal === "vps"}
        onClose={() => setActiveModal(null)}
        lang={lang}
      />
    </header>
  );
};
