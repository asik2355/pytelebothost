import React from "react";
import {
  Play,
  UploadCloud,
  Terminal,
  Key,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { WorkspaceStatus, TelegramBotProfile } from "../types";

interface HomePageViewProps {
  status: WorkspaceStatus | null;
  botProfile: TelegramBotProfile | null;
  lang: "bn" | "en";
  onNavigate: (route: string) => void;
  onStartBot: () => void;
  onStopBot: () => void;
  isActionLoading: boolean;
}

export const HomePageView: React.FC<HomePageViewProps> = ({
  status,
  botProfile,
  lang,
  onNavigate,
  onStartBot,
  onStopBot,
  isActionLoading,
}) => {
  const isRunning = status?.status === "running";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-medium border border-sky-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "টেলিগ্রাম বট হোস্টিং প্ল্যাটফর্ম" : "Telegram Bot Hosting Platform"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {lang === "bn"
              ? "ক্লাউডে টেলিগ্রাম বট হোস্ট এবং পরিচালনা করুন"
              : "Deploy & Manage Telegram Bots in the Cloud"}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            {lang === "bn"
              ? "Python কোড ও requirements.txt আপলোড করে সরাসরি ২৪/৭ টেলিগ্রাম বট রান করুন। লাইভ টার্মিনাল লগ এবং সহজ কনফিগারেশন সুবিধা।"
              : "Upload your Python bot scripts and requirements.txt to run high-uptime bots with live logs and instant Telegram API verification."}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const runnerEl = document.getElementById("bot-workspace-runner");
                if (runnerEl) runnerEl.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
            >
              <Terminal className="w-4 h-4" />
              <span>{lang === "bn" ? "বট কন্ট্রোলার ও ফাইলস" : "Workspace & Terminal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate("/bot-store")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-medium transition-all active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>{lang === "bn" ? "রেডিমেড বট স্টোর" : "Explore Bot Store"}</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative Graphic */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-20 pointer-events-none hidden md:block">
          <Terminal className="w-72 h-72 text-sky-400" />
        </div>
      </div>

      {/* Real-time Status Card Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bot State */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {lang === "bn" ? "বটের বর্তমান অবস্থা" : "Bot Status"}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
          </div>
          <div className="my-2">
            <p className="text-lg font-bold text-slate-900 capitalize">
              {isRunning
                ? lang === "bn"
                  ? "অনলাইন (সক্রিয়)"
                  : "Online & Running"
                : lang === "bn"
                ? "বট বন্ধ আছে"
                : "Stopped"}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {status?.currentEntryFile || "bot.py"}
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("bot-workspace-runner");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 pt-1"
          >
            <span>{lang === "bn" ? "রানার নিয়ন্ত্রণ দেখুন" : "View Controller"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Telegram Account Connected */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {lang === "bn" ? "সংযুক্ত টেলিগ্রাম বট" : "Connected Bot"}
            </span>
            <Key className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <p className="text-sm font-bold text-slate-900 truncate">
              {botProfile ? `@${botProfile.username}` : lang === "bn" ? "টোকেন সেট করা হয়নি" : "No Token Set"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {botProfile ? botProfile.first_name : lang === "bn" ? "BOT_TOKEN প্রয়োজন" : "Configure BOT_TOKEN"}
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("telegram-token-card");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else {
                const runnerEl = document.getElementById("bot-workspace-runner");
                if (runnerEl) runnerEl.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 pt-1"
          >
            <span>{lang === "bn" ? "টোকেন পরিবর্তন" : "Manage Token"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Workspace Files */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {lang === "bn" ? "আপলোড করা ফাইল" : "Workspace Files"}
            </span>
            <UploadCloud className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <p className="text-lg font-bold text-slate-900">
              {status?.files.length || 0} {lang === "bn" ? "টি ফাইল" : "files"}
            </p>
            <p className="text-xs text-slate-400">
              {status?.files.some((f) => f.name === "requirements.txt")
                ? "requirements.txt ✓"
                : "No requirements.txt"}
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("file-uploader-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else {
                const runnerEl = document.getElementById("bot-workspace-runner");
                if (runnerEl) runnerEl.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 pt-1"
          >
            <span>{lang === "bn" ? "ফাইল আপলোড করুন" : "Upload More"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Server Architecture */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {lang === "bn" ? "পরিবেশ ও রানটাইম" : "Runtime Environment"}
            </span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-2">
            <p className="text-sm font-bold text-slate-900">Python 3.10.12</p>
            <p className="text-xs text-slate-500">Linux x86_64 • Pip Ready</p>
          </div>
          <button
            onClick={() => onNavigate("/services")}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 pt-1"
          >
            <span>{lang === "bn" ? "সার্ভিস বিবরণী" : "View Specs"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Launch & How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => {
            const el = document.getElementById("file-uploader-section") || document.getElementById("bot-workspace-runner");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="bg-white border border-slate-200 hover:border-sky-300 p-5 rounded-xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {lang === "bn" ? "১. ফাইল আপলোড করুন" : "1. Upload Python Script"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "bn"
              ? "আপনার টেলিগ্রাম বটের python ফাইল এবং requirements.txt ড্র্যাগ করে সহজে আপলোড করুন।"
              : "Drag & drop your bot.py and requirements.txt directly into the runner environment."}
          </p>
        </div>

        <div
          onClick={() => onNavigate("/bot-store")}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {lang === "bn" ? "২. বট স্টোর থেকে টেমপ্লেট" : "2. Pick from Bot Store"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "bn"
              ? "কোড না লিখে সরাসরি তৈরি বট টেমপ্লেট (ইকো, ইনলাইন মেনু, এআই বট) লোড করে চালান।"
              : "Deploy ready-to-run Telegram bot templates without writing boilerplate code."}
          </p>
        </div>

        <div
          onClick={() => onNavigate("/billing")}
          className="bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {lang === "bn" ? "৩. ২৪/৭ ব্যাকগ্রাউন্ড হোস্টিং" : "3. 24/7 Cloud Execution"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "bn"
              ? "সার্ভিস এবং বিলিং অপশন দেখে আপনার বটের নিরবচ্ছিন্ন রানটাইম নিশ্চিত করুন।"
              : "Manage server allocations, auto-restart triggers, and uninterrupted uptime plans."}
          </p>
        </div>
      </div>
    </div>
  );
};
