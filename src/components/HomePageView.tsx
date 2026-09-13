import React, { useState } from "react";
import {
  Calendar,
  Gift,
  Server,
  Lock,
  ExternalLink,
  Activity,
  Network,
  Hourglass,
  Check,
  Copy,
  Terminal,
  Play,
  Square,
  RotateCw,
  Sparkles,
  X,
  ShieldCheck,
  ChevronRight,
  Key,
  Store,
  Bot,
  Plus,
  Layers,
  Sparkle,
  Trash2,
} from "lucide-react";
import { WorkspaceStatus, TelegramBotProfile, AppNotification, ActiveServer } from "../types";
import { PurchasePlanModal, PlanToPurchase } from "./PurchasePlanModal";

interface HomePageViewProps {
  status: WorkspaceStatus | null;
  botProfile: TelegramBotProfile | null;
  lang: "bn" | "en";
  onNavigate: (route: string) => void;
  onStartBot: () => void;
  onStopBot: () => void;
  onRestartBot?: () => void;
  onInstallReqs?: () => void;
  isActionLoading: boolean;
  walletBalance?: number;
  onWalletUpdated?: (newBalance: number) => void;
  onAddNotification?: (notif: AppNotification) => void;
  servers?: ActiveServer[];
  onServerCreated?: (server: ActiveServer) => void;
  onRefreshServers?: () => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({
  status,
  botProfile,
  lang,
  onNavigate,
  onStartBot,
  onStopBot,
  onRestartBot,
  onInstallReqs,
  isActionLoading,
  walletBalance = 117.5,
  onWalletUpdated,
  onAddNotification,
  servers = [],
  onServerCreated,
  onRefreshServers,
}) => {
  const isRunning = status?.status === "running";

  // Password generator state
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Claim Rewards Modal state
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [claimedDaily, setClaimedDaily] = useState(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Active Server Management State
  const [managingServerId, setManagingServerId] = useState<string | null>(null);
  const [serverActionLoading, setServerActionLoading] = useState<string | null>(null);

  // Purchase Modal from Home
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployPlan, setDeployPlan] = useState<PlanToPurchase>({
    id: "mini-v1",
    name: "Mini-v1",
    price: 100,
  });

  // Handle password generation
  const handleGenPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);

    onAddNotification?.({
      id: `notif-pwd-${Date.now()}`,
      title: "Panel Password Generated",
      titleBn: "প্যানেল পাসওয়ার্ড তৈরি হয়েছে",
      desc: "A secure temporary password was created and copied to your clipboard.",
      descBn: "প্যানেল অ্যাক্সেসের জন্য একটি নিরাপদ পাসওয়ার্ড তৈরি ও কপি করা হয়েছে।",
      timestamp: new Date().toISOString(),
      type: "system",
      read: false,
      link: "/home",
    });
  };

  // Handle Claim Daily Reward
  const handleClaimDailyReward = () => {
    if (claimedDaily) return;
    const bonus = 25.0;
    const newBal = walletBalance + bonus;
    setClaimedDaily(true);
    onWalletUpdated?.(newBal);
    setRewardToast(
      lang === "bn"
        ? "অভিনন্দন! দৈনিক ৳২৫.০০ রিওয়ার্ড আপনার ওয়ালেটে যোগ হয়েছে।"
        : "Congratulations! Daily ৳25.00 reward added to your wallet."
    );

    onAddNotification?.({
      id: `notif-reward-${Date.now()}`,
      title: "Daily Reward Claimed",
      titleBn: "দৈনিক রিওয়ার্ড গ্রহণ সম্পন্ন",
      desc: `৳25.00 daily bonus credited! New balance: ৳${newBal.toFixed(2)}`,
      descBn: `৳২৫.০০ রিওয়ার্ড ওয়ালেটে জমা হয়েছে! বর্তমান ব্যালেন্স: ৳${newBal.toFixed(2)}`,
      timestamp: new Date().toISOString(),
      type: "deposit",
      read: false,
      amount: bonus,
      link: "/billing",
    });

    setTimeout(() => setRewardToast(null), 4000);
  };

  // Handle Voucher Redeem
  const handleRedeemVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = voucherCode.trim().toUpperCase();
    if (!cleanCode) return;

    let amount = 50.0;
    if (cleanCode === "ZEROBOT" || cleanCode === "CONTABO" || cleanCode === "BONUS") {
      amount = 50.0;
    } else {
      amount = 20.0;
    }

    const newBal = walletBalance + amount;
    onWalletUpdated?.(newBal);
    setRewardToast(
      lang === "bn"
        ? `ভাউচার সফল! ৳${amount.toFixed(2)} আপনার ওয়ালেটে যুক্ত হয়েছে।`
        : `Voucher redeemed! ৳${amount.toFixed(2)} added to your wallet.`
    );
    setVoucherCode("");

    onAddNotification?.({
      id: `notif-voucher-${Date.now()}`,
      title: "Voucher Code Redeemed",
      titleBn: "ভাউচার রিডিম সফল হয়েছে",
      desc: `Coupon "${cleanCode}" applied. ৳${amount.toFixed(2)} added to your wallet.`,
      descBn: `ভাউচার "${cleanCode}" রিডিম হয়েছে। ৳${amount.toFixed(2)} ওয়ালেটে যুক্ত হয়েছে।`,
      timestamp: new Date().toISOString(),
      type: "deposit",
      read: false,
      amount: amount,
      link: "/billing",
    });

    setTimeout(() => {
      setRewardToast(null);
      setIsRewardModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto md:max-w-3xl lg:max-w-4xl">
      {/* Toast Alert */}
      {rewardToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{rewardToast}</span>
        </div>
      )}

      {/* 1. Header Section matching Screenshot 1 */}
      <div className="space-y-2 pt-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-sans">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm sm:text-base font-normal leading-relaxed">
          {lang === "bn"
            ? "স্বাগতম। আপনার সার্ভিস এবং ক্লাউড সার্ভারগুলোর বর্তমান অবস্থা এখানে প্রদর্শিত হচ্ছে।"
            : "Welcome back. Here's what's happening with your services."}
        </p>

        {/* Member Since Pill Badge */}
        <div className="pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white/90 text-slate-600 text-xs font-medium shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Member Since: Jul 25, 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Top Action Cards matching Screenshot 1 */}
      <div className="space-y-3.5">
        {/* Card 1: Bot Store */}
        <div
          id="home-bot-store-card"
          onClick={() => onNavigate("/bot-store")}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Store className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-sky-700 transition-colors">
                Bot Store
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {lang === "bn"
                  ? "রেডিমেড টেলিগ্রাম বট ও টেমপ্লেট ব্রাউজ করুন"
                  : "Explore ready-to-run bot templates"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 2: Hosting Plans */}
        <div
          id="home-hosting-plans-card"
          onClick={() => onNavigate("/services")}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              {/* Custom 2-server stacked icon like screenshot */}
              <div className="w-6 h-6 flex flex-col justify-center gap-1">
                <div className="w-6 h-2.5 rounded-sm border-2 border-current flex items-center justify-end px-0.5">
                  <div className="w-1 h-1 rounded-full bg-current" />
                </div>
                <div className="w-6 h-2.5 rounded-sm border-2 border-current flex items-center justify-end px-0.5">
                  <div className="w-1 h-1 rounded-full bg-current" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-purple-700 transition-colors">
                Hosting Plans
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {lang === "bn" ? "উপলব্ধ হোস্টিং প্ল্যানসমূহ দেখুন" : "Browse available plans"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 3: Panel Access */}
        <div
          id="home-panel-access-card"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5"
        >
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">Panel Access</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {lang === "bn" ? "বট ও ক্লাউড সার্ভার পরিচালনা করুন" : "Manage game servers"}
              </p>
            </div>
          </div>

          {/* Inner Email Container matching screenshot */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3 sm:p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              EMAIL
            </span>
            <div className="text-sm font-semibold text-slate-900 font-mono select-all truncate">
              asikgamerbd@gmail.com
            </div>
          </div>

          {/* Action Row: Gen Password + External Link Icon */}
          <div className="flex items-center gap-2.5 pt-0.5">
            <button
              id="gen-password-btn"
              type="button"
              onClick={handleGenPassword}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-900 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-900 font-semibold text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedPassword ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Password Copied!</span>
                </>
              ) : (
                <span>Gen Password</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("bot-workspace-runner");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-10 h-10 rounded-xl border border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title={lang === "bn" ? "কনসোলে প্রবেশ করুন" : "Open Control Panel"}
            >
              <ExternalLink className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* If password was generated, display it copyable */}
          {generatedPassword && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-mono font-bold text-emerald-900 truncate">
                {generatedPassword}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  setCopiedPassword(true);
                  setTimeout(() => setCopiedPassword(false), 2000);
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 text-[11px] shrink-0 ml-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPassword ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Active Servers Section matching Screenshot 2 */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-slate-800 stroke-[2]" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Active Servers</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDeployPlan({
                  id: "mini-v1",
                  name: "Mini-v1",
                  price: 100,
                });
                setIsDeployModalOpen(true);
              }}
              className="text-xs font-bold text-white bg-[#5438dc] hover:bg-[#472ecc] active:scale-95 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Server</span>
            </button>
            <button
              onClick={() => onNavigate("/services")}
              className="text-xs sm:text-sm font-semibold text-[#5438dc] hover:text-[#432bc4] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All</span>
              <span className="text-base leading-none">↗</span>
            </button>
          </div>
        </div>

        {/* Dynamic Server Cards List */}
        {(() => {
          const displayServers = servers || [];

          if (displayServers.length === 0) {
            return (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {lang === "bn" ? "কোন সক্রিয় সার্ভার নেই" : "No Active Servers"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {lang === "bn"
                      ? "আপনার কোনো সক্রিয় ক্লাউড সার্ভার নেই। বট রান করতে নিচের বাটনে ক্লিক করে নতুন সার্ভার ডিপ্লয় করুন।"
                      : "You have no active cloud servers. Deploy a new server to run your bot."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeployPlan({
                      id: "mini-v1",
                      name: "Mini-v1",
                      price: 100,
                    });
                    setIsDeployModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5438dc] hover:bg-[#432bc4] text-white text-xs font-semibold shadow-2xs cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === "bn" ? "নতুন সার্ভার ডিপ্লয় করুন" : "Deploy Server"}</span>
                </button>
              </div>
            );
          }

          const handleServerToggle = async (srv: ActiveServer, action: "start" | "stop" | "restart") => {
            setServerActionLoading(srv.id);
            try {
              if (srv.id === "nova") {
                if (action === "stop") onStopBot();
                else if (action === "start") onStartBot();
                else if (action === "restart") onRestartBot?.();
              }
              await fetch("/api/servers/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serverId: srv.id, action }),
              });
              onRefreshServers?.();
            } catch {
              // ignore
            } finally {
              setServerActionLoading(null);
            }
          };

          const handleDeleteServer = async (srvId: string, srvName: string) => {
            const confirmMsg =
              lang === "bn"
                ? `আপনি কি সত্যিই "${srvName}" সার্ভারটি ডিলিট করতে চান?`
                : `Are you sure you want to delete server "${srvName}"?`;
            if (!window.confirm(confirmMsg)) return;

            setServerActionLoading(srvId);
            try {
              const res = await fetch(`/api/servers/${srvId}`, {
                method: "DELETE",
              });
              if (res.ok) {
                onRefreshServers?.();
                onAddNotification?.({
                  id: `srv-del-${Date.now()}`,
                  title: "Server Removed",
                  titleBn: "সার্ভার ডিলিট হয়েছে",
                  desc: `Server "${srvName}" was terminated.`,
                  descBn: `সার্ভার "${srvName}" ডিলিট করা হয়েছে।`,
                  timestamp: new Date().toISOString(),
                  type: "system",
                  read: false,
                });
              }
            } catch {
              // ignore
            } finally {
              setServerActionLoading(null);
            }
          };

          return displayServers.map((srv, idx) => {
            const isSrvManaging = managingServerId === srv.id;
            // Real status: RUNNING only when server.status is explicitly "RUNNING"
            const isSrvRunning = srv.status === "RUNNING";

            // Active wave if running; flat neutral line if stopped
            const wavePaths = [
              "M2 24 L10 20 L20 27 L30 15 L40 22 L50 8 L60 18 L70 11 L80 19 L90 8 L98 14",
              "M2 22 L12 26 L22 18 L32 24 L42 12 L52 20 L62 10 L72 16 L82 8 L92 14 L98 10",
              "M2 20 L10 12 L20 25 L30 16 L40 20 L50 6 L60 15 L70 9 L80 22 L90 7 L98 12",
              "M2 26 L12 18 L22 22 L32 14 L42 19 L52 9 L62 16 L72 12 L82 17 L92 10 L98 13",
            ];
            const wavePath = isSrvRunning
              ? wavePaths[idx % wavePaths.length]
              : "M2 17 L98 17";

            return (
              <div
                key={srv.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 transition-all hover:border-slate-300"
              >
                {/* Header Row: Server Title & RUNNING Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Stacked Disk Icon in rounded gray box */}
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <div className="w-5 h-5 flex flex-col justify-center gap-0.8">
                        <div className="w-5 h-2 rounded-[3px] border-[1.8px] border-current flex items-center justify-end px-0.5">
                          <div className="w-0.8 h-0.8 rounded-full bg-current" />
                        </div>
                        <div className="w-5 h-2 rounded-[3px] border-[1.8px] border-current flex items-center justify-end px-0.5">
                          <div className="w-0.8 h-0.8 rounded-full bg-current" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {srv.name}
                        </h3>
                        {srv.isCustom && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#5438dc] border border-indigo-200/60">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <Network className="w-3.5 h-3.5" />
                        <span>{srv.region}</span>
                        <span className="text-slate-300">•</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-[#5438dc] font-mono text-[10px] font-bold border border-purple-200/60">
                          {srv.category}
                        </span>
                        {srv.planName && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({srv.planName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RUNNING Status Pill Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs border ${
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

                {/* Activity Wave Graph & Stats Row matching screenshot */}
                <div className="flex items-center justify-between py-1 px-1">
                  {/* Green Zig-Zag Sparkline Wave */}
                  <div className="w-24 sm:w-32 h-10 flex items-center">
                    <svg
                      className={`w-full h-8 stroke-current fill-none ${
                        isSrvRunning ? "text-emerald-500" : "text-slate-300"
                      }`}
                      viewBox="0 0 100 35"
                    >
                      <path
                        d={wavePath}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Stats Column: Right-aligned */}
                  <div className="text-right space-y-0.5 text-xs sm:text-[13px] text-slate-700 font-sans font-medium">
                    <div>{isSrvRunning ? (srv.ramUsage || "84.50 MB RAM") : "0.00 MB RAM"}</div>
                    <div>{isSrvRunning ? (srv.cpuUsage || "0.45% CPU") : "0.00% CPU"}</div>
                    <div>{isSrvRunning ? (srv.diskUsage || "14.2 MB Disk") : "0.00 MB Disk"}</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  {/* Left: days left */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                    <Hourglass className="w-3.5 h-3.5 text-slate-400" />
                    <span>{srv.daysLeft || "30d left"}</span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("bot-workspace-runner");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                        else onNavigate("/services");
                      }}
                      className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Open Web Terminal / Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setManagingServerId(managingServerId === srv.id ? null : srv.id)
                      }
                      className="px-4 sm:px-5 py-2 rounded-xl bg-[#5438dc] hover:bg-[#472ecc] active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Manage</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Manage Panel for this Server */}
                {isSrvManaging && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in slide-in-from-top-2 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#5438dc]" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {srv.name} • {srv.category} Control
                        </span>
                      </div>
                      <button
                        onClick={() => setManagingServerId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Server Control Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isSrvRunning ? (
                        <button
                          disabled={isActionLoading || serverActionLoading === srv.id}
                          onClick={() => handleServerToggle(srv, "stop")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>{lang === "bn" ? "সার্ভার বন্ধ করুন" : "Stop Server"}</span>
                        </button>
                      ) : (
                        <button
                          disabled={isActionLoading || serverActionLoading === srv.id}
                          onClick={() => handleServerToggle(srv, "start")}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{lang === "bn" ? "সার্ভার চালু করুন" : "Start Server"}</span>
                        </button>
                      )}

                      <button
                        disabled={isActionLoading || serverActionLoading === srv.id}
                        onClick={() => handleServerToggle(srv, "restart")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>{lang === "bn" ? "রিস্টার্ট" : "Restart"}</span>
                      </button>

                      <button
                        disabled={isActionLoading || serverActionLoading === srv.id}
                        onClick={() => handleDeleteServer(srv.id, srv.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title={lang === "bn" ? "সার্ভার ডিলিট করুন" : "Delete Server"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === "bn" ? "ডিলিট" : "Delete"}</span>
                      </button>

                      {srv.id === "nova" && onInstallReqs && (
                        <button
                          disabled={isActionLoading}
                          onClick={onInstallReqs}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <span>pip install</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate("/services")}
                        className="ml-auto text-xs text-[#5438dc] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{lang === "bn" ? "প্ল্যান বিস্তারিত" : "Upgrade / Plans"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Server Info snippet */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">CATEGORY / LANGUAGE</span>
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
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[10px]">HEALTH</span>
                        <span className="font-bold text-emerald-600">
                          {isSrvRunning ? "99.98% Active" : "Suspended"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* 4. Claim Rewards Modal */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Claim Rewards</h3>
                  <p className="text-xs text-slate-500">Get free wallet credits</p>
                </div>
              </div>
              <button
                onClick={() => setIsRewardModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Daily Login Reward Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Daily Login Bonus</span>
                <span className="text-lg font-extrabold text-emerald-700 font-mono">+৳25.00</span>
              </div>
              <button
                onClick={handleClaimDailyReward}
                disabled={claimedDaily}
                className={`px-4 py-2 rounded-xl font-bold text-xs shadow-2xs transition-all ${
                  claimedDaily
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white"
                }`}
              >
                {claimedDaily ? "Claimed ✓" : "Claim Now"}
              </button>
            </div>

            {/* Voucher Code Form */}
            <form onSubmit={handleRedeemVoucher} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Redeem Voucher or Promo Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. ZEROBOT or REWARD2026"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={!voucherCode.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Redeem Voucher
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Purchase Plan Modal directly from Home Deploy Server Button */}
      {isDeployModalOpen && (
        <PurchasePlanModal
          plan={deployPlan}
          walletBalance={walletBalance}
          onClose={() => setIsDeployModalOpen(false)}
          onSuccess={(newServer, newWalletBalance) => {
            onWalletUpdated?.(newWalletBalance);
            onServerCreated?.(newServer);
            onRefreshServers?.();
            onAddNotification?.({
              id: `srv-${Date.now()}`,
              title: "Server Deployed!",
              titleBn: "সার্ভার ডিপ্লয় সফল হয়েছে!",
              desc: `Server "${newServer.name}" (${newServer.category}) is now active.`,
              descBn: `সার্ভার "${newServer.name}" (${newServer.category}) সফলভাবে সক্রিয় হয়েছে।`,
              timestamp: new Date().toISOString(),
              type: "server",
              read: false,
              link: "/home",
            });
          }}
          onNavigateToBilling={() => {
            setIsDeployModalOpen(false);
            onNavigate("/billing");
          }}
        />
      )}
    </div>
  );
};
