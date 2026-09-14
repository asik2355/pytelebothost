import React, { useState } from "react";
import {
  Search,
  Hourglass,
  Network,
  LayoutGrid,
  List,
  Menu,
  Plus,
  Play,
  Square,
  RotateCw,
  Trash2,
  ExternalLink,
  Terminal,
  X,
  Server,
  ChevronLeft,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { ActiveServer, AppNotification, AuthUser } from "../types";
import { PurchasePlanModal, PlanToPurchase } from "./PurchasePlanModal";
import { Lock, LogIn, UserPlus } from "lucide-react";

interface MyServersPageViewProps {
  servers: ActiveServer[];
  lang: "bn" | "en";
  currentUser?: AuthUser | null;
  onNavigate: (route: string) => void;
  onRefreshServers: () => void;
  onAddNotification?: (notif: AppNotification) => void;
  walletBalance: number;
  onWalletUpdated?: (balance: number) => void;
  onServerCreated?: (server: ActiveServer) => void;
  onSelectServerForManage?: (server: ActiveServer) => void;
}

type StatusFilter = "ALL SERVERS" | "RUNNING" | "INSTALLING" | "SUSPENDED" | "OFFLINE";
type ViewMode = "cards" | "grid" | "compact";

export const MyServersPageView: React.FC<MyServersPageViewProps> = ({
  servers = [],
  lang,
  currentUser,
  onNavigate,
  onRefreshServers,
  onAddNotification,
  walletBalance,
  onWalletUpdated,
  onServerCreated,
  onSelectServerForManage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("ALL SERVERS");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [managingServerId, setManagingServerId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Deploy Modal State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployPlan, setDeployPlan] = useState<PlanToPurchase>({
    id: "mini-v1",
    name: "Mini-v1",
    price: 100,
  });

  // Filter servers based on query & status
  const filteredServers = servers.filter((srv) => {
    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = srv.name.toLowerCase().includes(q);
      const matchCat = srv.category.toLowerCase().includes(q);
      const matchRegion = srv.region.toLowerCase().includes(q);
      const matchPlan = (srv.planName || "").toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchRegion && !matchPlan) return false;
    }

    // Status filter
    if (selectedFilter === "ALL SERVERS") return true;
    if (selectedFilter === "RUNNING") return srv.status === "RUNNING";
    if (selectedFilter === "OFFLINE") return srv.status === "STOPPED";
    if (selectedFilter === "INSTALLING") return false; // none currently installing
    if (selectedFilter === "SUSPENDED") return false;

    return true;
  });

  // Handle Server Start / Stop / Restart
  const handleServerAction = async (serverId: string, action: "start" | "stop" | "restart") => {
    setActionLoadingId(serverId);
    try {
      const res = await fetch("/api/servers/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, action }),
      });
      if (res.ok) {
        onRefreshServers();
        const srv = servers.find((s) => s.id === serverId);
        const name = srv?.name || "Server";
        onAddNotification?.({
          id: `srv-action-${Date.now()}`,
          title: `Server ${action === "start" ? "Started" : action === "stop" ? "Stopped" : "Restarted"}`,
          titleBn: `সার্ভার ${action === "start" ? "চালু" : action === "stop" ? "বন্ধ" : "রিস্টার্ট"} করা হয়েছে`,
          desc: `Server "${name}" is now ${action === "stop" ? "STOPPED" : "RUNNING"}.`,
          descBn: `সার্ভার "${name}" এখন ${action === "stop" ? "বন্ধ" : "চলমান"} আছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Server Deletion
  const handleDeleteServer = async (serverId: string, serverName: string) => {
    const confirmText =
      lang === "bn"
        ? `আপনি কি নিশ্চিতভাবে "${serverName}" সার্ভারটি স্থায়ীভাবে মুছে ফেলতে চান?`
        : `Are you sure you want to permanently delete server "${serverName}"?`;
    if (!window.confirm(confirmText)) return;

    setActionLoadingId(serverId);
    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefreshServers();
        setManagingServerId(null);
        onAddNotification?.({
          id: `srv-del-${Date.now()}`,
          title: "Server Terminated",
          titleBn: "সার্ভার ডিলিট করা হয়েছে",
          desc: `Server "${serverName}" has been successfully terminated.`,
          descBn: `সার্ভার "${serverName}" সফলভাবে ডিলিট করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusFilters: StatusFilter[] = [
    "ALL SERVERS",
    "RUNNING",
    "INSTALLING",
    "SUSPENDED",
    "OFFLINE",
  ];

  return (
    <div id="my-servers-page-view" className="space-y-6 pb-24">
      {/* 1. Header with Breadcrumb and Deploy Server Button */}
      <div className="space-y-3">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate("/home")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{lang === "bn" ? "হোম পেজে ফিরে যান" : "Back to Home"}</span>
          </button>

          <button
            onClick={() => {
              setDeployPlan({
                id: "mini-v1",
                name: "Mini-v1",
                price: 100,
              });
              setIsDeployModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5438dc] hover:bg-[#472ecc] active:scale-95 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === "bn" ? "নতুন সার্ভার তৈরি" : "Deploy Server"}</span>
          </button>
        </div>

        {/* Title and Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Servers
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 font-normal leading-relaxed">
            {lang === "bn"
              ? "আপনার সক্রিয় ও ডিপ্লয়কৃত ক্লাউড সার্ভারগুলোর বিস্তারিত তালিকা ও নিয়ন্ত্রণ।"
              : "A simplified overview of your active deployments and server instances."}
          </p>
        </div>
      </div>

      {/* Guest Lock Gate if not logged in */}
      {!currentUser && (
        <div className="p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {lang === "bn" ? "লগইন প্রয়োজন" : "Authentication Required"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {lang === "bn"
                ? "আপনার নিজস্ব সার্ভারগুলো দেখতে ও নতুন সার্ভার তৈরি করতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।"
                : "Please sign in or register to view and control your personal cloud servers."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate("/login")}
              className="px-5 py-2.5 bg-[#5438dc] hover:bg-[#472ecc] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{lang === "bn" ? "সাইন ইন করুন" : "Sign In"}</span>
            </button>
            <button
              onClick={() => onNavigate("/registration")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === "bn" ? "রেজিস্ট্রেশন" : "Register"}</span>
            </button>
          </div>
        </div>
      )}

      {currentUser && (
        <>
          {/* 2. Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === "bn" ? "সার্ভারের নাম বা লোকেশন দিয়ে খুঁজুন..." : "Search servers..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#5438dc]/20 focus:border-[#5438dc] text-sm bg-white shadow-2xs placeholder:text-slate-400 font-sans transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Filter Pills Row & Layout View Switcher */}
      <div className="space-y-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statusFilters.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-[#5438dc] text-white shadow-sm"
                    : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher (Grid / Cards / Compact) */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#5438dc] shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-[#5438dc] text-white shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Card View (Default)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-white text-[#5438dc] shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Compact View"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {lang === "bn"
              ? `${filteredServers.length} টি সার্ভার পাওয়া গেছে`
              : `${filteredServers.length} servers found`}
          </div>
        </div>
      </div>

      {/* 4. Server Cards List */}
      {filteredServers.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#5438dc] mx-auto flex items-center justify-center">
            <Server className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {searchQuery
                ? lang === "bn"
                  ? "কোনো সার্ভার খুঁজে পাওয়া যায়নি"
                  : "No servers match your search"
                : lang === "bn"
                ? "কোন সক্রিয় সার্ভার নেই"
                : "No active servers"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? lang === "bn"
                  ? "ভিন্ন শব্দ দিয়ে অনুসন্ধান করুন অথবা ফিল্টার পরিবর্তন করুন।"
                  : "Try different keywords or clear your status filters."
                : lang === "bn"
                ? "আপনার এই মুহূর্তে কোনো ক্লাউড সার্ভার তৈরি করা নেই। এখনই নতুন সার্ভার তৈরি করতে পারেন।"
                : "You don't have any cloud servers deployed yet. Deploy your first bot server now."}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setDeployPlan({
                  id: "mini-v1",
                  name: "Mini-v1",
                  price: 100,
                });
                setIsDeployModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5438dc] hover:bg-[#472ecc] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-2xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === "bn" ? "নতুন সার্ভার ডিপ্লয় করুন" : "Deploy Server"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Server Cards Display */
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "space-y-4"
          }
        >
          {filteredServers.map((srv) => {
            const isSrvRunning = srv.status === "RUNNING";
            const isManaging = managingServerId === srv.id;
            const isLoading = actionLoadingId === srv.id;

            return (
              <div
                key={srv.id}
                id={`server-card-${srv.id}`}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-purple-200 hover:shadow-xs transition-all"
              >
                {/* Top Row: Icon + Name + Status + Region */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* 2-Stacked Server Device Icon matching screenshot */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                      <div className="w-6 h-6 flex flex-col justify-center gap-1 text-[#5438dc]">
                        <div className="w-6 h-2.5 rounded-xs border-2 border-current flex items-center justify-end px-0.5">
                          <div className="w-1 h-1 rounded-full bg-current" />
                        </div>
                        <div className="w-6 h-2.5 rounded-xs border-2 border-current flex items-center justify-end px-0.5">
                          <div className="w-1 h-1 rounded-full bg-current" />
                        </div>
                      </div>
                    </div>

                    {/* Server Info */}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          {srv.name}
                        </h2>

                        {/* RUNNING / OFFLINE Status Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                            isSrvRunning
                              ? "bg-[#e6f8ef] text-[#059669] border-emerald-200/90"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSrvRunning ? "bg-[#10b981] animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{isSrvRunning ? "RUNNING" : "STOPPED"}</span>
                        </div>
                      </div>

                      {/* Region & Hash Node */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        <div className="flex items-center gap-1 text-slate-600 font-mono">
                          <Network className="w-3.5 h-3.5 text-slate-400" />
                          <span>{srv.region || "EU • 043a9bc6"}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#5438dc] font-mono text-[11px] font-bold">
                          {srv.category}
                        </span>
                        {srv.planName && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({srv.planName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Specs Strip (RAM • CPU • Disk) matching Screenshot */}
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-2.5 text-xs sm:text-[13px] font-mono text-slate-700 font-medium flex items-center justify-between sm:justify-start gap-2 flex-wrap">
                  <span>{isSrvRunning ? (srv.ramUsage || "142.50 MB RAM") : "0.00 MB RAM"}</span>
                  <span className="text-slate-300">•</span>
                  <span>{isSrvRunning ? (srv.cpuUsage || "46.366% CPU") : "0.00% CPU"}</span>
                  <span className="text-slate-300">•</span>
                  <span>{isSrvRunning ? (srv.diskUsage || "86.26 MB Disk") : "0.00 MB Disk"}</span>
                </div>

                {/* Third Row: Days Left Pill */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white text-slate-700 text-xs font-bold shadow-2xs">
                    <Hourglass className="w-3.5 h-3.5 text-purple-600 stroke-[2.2]" />
                    <span className="tracking-wide uppercase font-mono">{srv.daysLeft || "30D LEFT"}</span>
                  </div>
                </div>

                {/* Bottom Action: Manage Server Button */}
                <div>
                  <button
                    onClick={() => {
                      if (onSelectServerForManage) {
                        onSelectServerForManage(srv);
                      } else {
                        setManagingServerId(managingServerId === srv.id ? null : srv.id);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-[#5438dc] hover:bg-[#472ecc] active:scale-[0.99] text-white font-semibold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Manage Server</span>
                  </button>
                </div>

                {/* Expandable Manage Panel for this Server */}
                {isManaging && (
                  <div className="mt-4 p-4.5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in slide-in-from-top-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#5438dc]" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {srv.name} Management & Controls
                        </span>
                      </div>
                      <button
                        onClick={() => setManagingServerId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isSrvRunning ? (
                        <button
                          disabled={isLoading}
                          onClick={() => handleServerAction(srv.id, "stop")}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>{lang === "bn" ? "সার্ভার বন্ধ করুন" : "Stop Server"}</span>
                        </button>
                      ) : (
                        <button
                          disabled={isLoading}
                          onClick={() => handleServerAction(srv.id, "start")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{lang === "bn" ? "সার্ভার চালু করুন" : "Start Server"}</span>
                        </button>
                      )}

                      <button
                        disabled={isLoading}
                        onClick={() => handleServerAction(srv.id, "restart")}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>{lang === "bn" ? "রিস্টার্ট" : "Restart"}</span>
                      </button>

                      <button
                        disabled={isLoading}
                        onClick={() => handleDeleteServer(srv.id, srv.name)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title={lang === "bn" ? "সার্ভার ডিলিট করুন" : "Delete Server"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === "bn" ? "ডিলিট" : "Delete"}</span>
                      </button>

                      <button
                        onClick={() => onNavigate("/services")}
                        className="ml-auto text-xs text-[#5438dc] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{lang === "bn" ? "প্ল্যান বিস্তারিত" : "Upgrade Plan"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Server Meta Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">CATEGORY</span>
                        <span className="font-mono font-bold text-slate-800 uppercase">
                          {srv.category}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">PLAN</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {srv.planName || "Cloud Bot"}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">HEALTH</span>
                        <span className="font-bold text-emerald-600">
                          {isSrvRunning ? "99.98% Active" : "Suspended"}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">REGION</span>
                        <span className="font-mono font-bold text-slate-700 truncate block">
                          {srv.region || "EU"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

          {/* Deploy Plan Modal */}
          <PurchasePlanModal
            isOpen={isDeployModalOpen}
            onClose={() => setIsDeployModalOpen(false)}
            plan={deployPlan}
            lang={lang}
            walletBalance={walletBalance}
            onNavigate={onNavigate}
            onServerCreated={(newSrv) => {
              onServerCreated?.(newSrv);
              onRefreshServers();
            }}
            onWalletUpdated={onWalletUpdated}
            onAddNotification={onAddNotification}
          />
        </>
      )}
    </div>
  );
};
