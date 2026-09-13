import React from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Shield,
  Zap,
  CheckCircle2,
  RefreshCw,
  Clock,
  Terminal,
} from "lucide-react";
import { WorkspaceStatus } from "../types";

interface ServicesPageViewProps {
  lang: "bn" | "en";
  status: WorkspaceStatus | null;
  onNavigate: (route: string) => void;
}

export const ServicesPageView: React.FC<ServicesPageViewProps> = ({
  lang,
  status,
  onNavigate,
}) => {
  const isRunning = status?.status === "running";

  const servicesList = [
    {
      title: lang === "bn" ? "Python 3.10 স্যান্ডবক্স" : "Python 3.10 Sandbox",
      desc:
        lang === "bn"
          ? "আইসোলেটেড ক্লাউড এনভায়রনমেন্ট যেখানে আপনার সব পাইথন কোড সাব-প্রসেস আকারে নিরাপদে রান হয়।"
          : "Isolated cloud container running secure Python sub-processes with real-time log capturing.",
      icon: Cpu,
      status: "Active",
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: lang === "bn" ? "Pip প্যাকেজ ম্যানেজার" : "Pip Package Manager",
      desc:
        lang === "bn"
          ? "python-telegram-bot, pyTelegramBotAPI (telebot), aiohttp সহ যে কোনো পাইথন প্যাকেজ ইনস্টলযোগ্য।"
          : "Direct requirements.txt resolution supporting popular Telegram frameworks and async engines.",
      icon: Zap,
      status: "Operational",
      badgeColor: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      title: lang === "bn" ? "রিয়েল-টাইম SSE লগ স্ট্রিমার" : "Real-time SSE Log Streamer",
      desc:
        lang === "bn"
          ? "stdout এবং stderr থেকে আসা প্রতিটা মেসেজ কোনো রিফ্রেশ ছাড়াই লাইভ ব্রাউজার টার্মিনালে স্ট্রিমিং।"
          : "Zero-latency Server-Sent Events streaming from stdout and stderr directly to your web console.",
      icon: Activity,
      status: "Active",
      badgeColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
    },
    {
      title: lang === "bn" ? "টেলিগ্রাম বোটফাদার টোকেন যাচাই" : "BotFather Token Validator",
      desc:
        lang === "bn"
          ? "সরাসরি অফিসিয়াল api.telegram.org কল করে বটের ইউজারনেম ও নাম যাচাইকরণ সার্ভিস।"
          : "Direct integration with api.telegram.org/bot<TOKEN>/getMe to verify credentials on the fly.",
      icon: Shield,
      status: "Online",
      badgeColor: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      title: lang === "bn" ? "অটো-রিকভারি ও ক্র্যাশ গার্ড" : "Process Guardian & Recovery",
      desc:
        lang === "bn"
          ? "প্রসেস ক্র্যাশ হলে এক্সিট কোড ডিটেকশন ও পরিষ্কার এরর মেসেজ স্ট্যাকট্রেস ডিসপ্লে।"
          : "Continuous child process monitoring, exit code auditing, and graceful termination hooks.",
      icon: RefreshCw,
      status: "Running",
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: lang === "bn" ? "লোকাল স্যান্ডবক্স স্টোরেজ" : "Workspace Disk Storage",
      desc:
        lang === "bn"
          ? "প্রতিটি বটের জন্য নির্ধারিত ডিরেক্টরি, কোড এডিটিং এবং ইনস্ট্যান্ট ফাইল ডাউনলোড ব্যাকআপ।"
          : "Isolated workspace directory with inline multi-file code editor and ZIP export capability.",
      icon: HardDrive,
      status: "100MB Free",
      badgeColor: "text-amber-700 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200 mb-2">
              <Server className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "ক্লাউড আর্কিটেকচার" : "Cloud Services & Status"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {lang === "bn" ? "সার্ভিস এবং সিস্টেম অবকাঠামো" : "Platform Services & Runtime"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "bn"
                ? "আপনার টেলিগ্রাম বট যে সার্ভার এবং সার্ভিসগুলির ওপর পরিচালিত হচ্ছে তার বিস্তারিত।"
                : "Active background daemons, runners, and integrations powering your Telegram bot instances."}
            </p>
          </div>

          <button
            onClick={() => onNavigate("/home")}
            className="self-start sm:self-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <Terminal className="w-4 h-4" />
            <span>{lang === "bn" ? "টার্মিনাল খুলুন" : "Open Terminal"}</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicesList.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${srv.badgeColor}`}
                  >
                    {srv.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{srv.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{srv.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {lang === "bn" ? "চলমান" : "Operational"}
                </span>
                <span>Uptime 99.9%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Allocation Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <span>{lang === "bn" ? "রিসোর্স ব্যবহার এবং সীমা" : "Current Resource Allocation"}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-xs text-slate-500 font-medium">CPU Cores</span>
            <p className="text-lg font-bold text-slate-800 mt-1">1 vCPU (Shared)</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div className="bg-sky-500 h-1.5 rounded-full w-1/4" />
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-xs text-slate-500 font-medium">Memory (RAM)</span>
            <p className="text-lg font-bold text-slate-800 mt-1">512 MB</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-500 h-1.5 rounded-full w-1/3" />
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-xs text-slate-500 font-medium">Active Bot Process</span>
            <p className="text-lg font-bold text-slate-800 mt-1">
              {isRunning ? `PID: ${status?.pid}` : lang === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${
                  isRunning ? "bg-emerald-500 w-full" : "bg-slate-300 w-0"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
