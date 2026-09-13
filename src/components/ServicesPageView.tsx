import React, { useState } from "react";
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
  Check,
  Sparkles,
  CreditCard,
  Layers,
} from "lucide-react";
import { WorkspaceStatus, AppNotification, ActiveServer } from "../types";
import { PurchasePlanModal, PlanToPurchase } from "./PurchasePlanModal";

interface ServicesPageViewProps {
  lang: "bn" | "en";
  status: WorkspaceStatus | null;
  walletBalance?: number;
  onNavigate: (route: string) => void;
  onWalletUpdated?: (newBalance: number) => void;
  onServerCreated?: (server: ActiveServer) => void;
  onAddNotification?: (notif: AppNotification) => void;
}

export const ServicesPageView: React.FC<ServicesPageViewProps> = ({
  lang,
  status,
  walletBalance = 117.5,
  onNavigate,
  onWalletUpdated,
  onServerCreated,
  onAddNotification,
}) => {
  const isRunning = status?.status === "running";
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [purchasingPlan, setPurchasingPlan] = useState<PlanToPurchase | null>(null);

  // Hosting & Bot Subscription Plans
  const hostingPlans = [
    {
      id: "free",
      name: lang === "bn" ? "ফ্রি স্টার্টার" : "Free Starter",
      priceMonthly: "৳ 0",
      priceYearly: "৳ 0",
      numPriceMonthly: 0,
      numPriceYearly: 0,
      period: lang === "bn" ? "আজীবন ফ্রি" : "Forever Free",
      description:
        lang === "bn"
          ? "নতুন ডেভেলপার ও ছোট টেলিগ্রাম বট টেস্ট ও শেখার জন্য উপযুক্ত।"
          : "Ideal for testing, learning, and hosting lightweight Telegram bots.",
      features: [
        lang === "bn" ? "১টি সক্রিয় টেলিগ্রাম বট ইনস্ট্যান্স" : "1 Active Telegram Bot Instance",
        lang === "bn" ? "৫১২ এমবি মেমোরি / ১ ভিপিসিউ" : "512 MB RAM / 1 vCPU",
        lang === "bn" ? "লাইভ রিয়েল-টাইম টার্মিনাল লগ" : "Real-time Live Terminal Logs",
        lang === "bn" ? "Pip প্যাকেজ ম্যানেজার এক্সেস" : "Pip Package Manager Access",
        lang === "bn" ? "কমিউনিটি সাপোর্ট" : "Community Support",
      ],
      isPopular: false,
      buttonText: lang === "bn" ? "বর্তমান সক্রিয় প্ল্যান" : "Current Active Plan",
      isCurrent: true,
    },
    {
      id: "mini-v1",
      name: "Mini-v1",
      priceMonthly: "৳ 100",
      priceYearly: "৳ 1,000",
      numPriceMonthly: 100,
      numPriceYearly: 1000,
      period: lang === "bn" ? "/ মাস" : "/ month",
      description:
        lang === "bn"
          ? "জনপ্রিয় ক্লাউড গেম ও টেলিগ্রাম বট সার্ভার (পাইথন, নোড, গো ও বান সাপোর্ট)।"
          : "High-speed cloud runner for 24/7 bots (Python3, Node.js, Go, Bun).",
      features: [
        lang === "bn" ? "১টি হাই-স্পিড ডেডিকেটেড সার্ভার" : "1 High-Speed Server Instance",
        lang === "bn" ? "১ জিবি ডিডিআর৪ মেমোরি / ১ কোর" : "1 GB Fast RAM / 1 Core",
        lang === "bn" ? "Python3, Node.js, Go, Bun নির্বাচন" : "Python3, Node.js, Go, Bun Runtimes",
        lang === "bn" ? "২৪/৭ ক্লাউড অটো-রিস্টার্ট" : "24/7 Cloud Auto-restart & Uptime",
        lang === "bn" ? "ওয়েব টার্মিনাল ও ফাইল এডিটর" : "Full Web Terminal & File Access",
      ],
      isPopular: true,
      buttonText: lang === "bn" ? "Mini-v1 কিনুন" : "Get Mini-v1",
      isCurrent: false,
    },
    {
      id: "pro",
      name: lang === "bn" ? "প্রো ডেভেলপার" : "Pro Developer",
      priceMonthly: "৳ 299",
      priceYearly: "৳ 2,990",
      numPriceMonthly: 299,
      numPriceYearly: 2990,
      period: lang === "bn" ? "/ মাস" : "/ month",
      description:
        lang === "bn"
          ? "২৪/৭ নিরবচ্ছিন্ন হোস্টিং এবং ভারী ডেটা প্রসেসিং বটের জন্য।"
          : "For production Telegram bots requiring 24/7 uptime & fast processing.",
      features: [
        lang === "bn" ? "৫টি যুগপত টেলিগ্রাম বট" : "5 Simultaneous Telegram Bots",
        lang === "bn" ? "২ জিবি হাই-স্পিড মেমোরি" : "2 GB High-Speed Memory",
        lang === "bn" ? "অটো-রিস্টার্ট এবং হেলথ মনিটরিং" : "Auto-restart & 24/7 Health Monitoring",
        lang === "bn" ? "কাস্টম এনভায়রনমেন্ট সিক্রেটস" : "Unlimited Custom Secrets & Env",
        lang === "bn" ? "অগ্রাধিকার ভিত্তিক টেলিগ্রাম সাপোর্ট" : "Priority Telegram Support (1 hr SLA)",
      ],
      isPopular: false,
      buttonText: lang === "bn" ? "প্রো আপগ্রেড করুন" : "Upgrade to Pro",
      isCurrent: false,
    },
    {
      id: "business",
      name: lang === "bn" ? "বিজনেস ও এজেন্সি" : "Business & Agency",
      priceMonthly: "৳ 799",
      priceYearly: "৳ 7,990",
      numPriceMonthly: 799,
      numPriceYearly: 7990,
      period: lang === "bn" ? "/ মাস" : "/ month",
      description:
        lang === "bn"
          ? "এন্টারপ্রাইজ গ্রাহক ও কমার্শিয়াল টেলিগ্রাম অটোমেশনের জন্য।"
          : "For enterprise scale, multi-client bots and commercial automation.",
      features: [
        lang === "bn" ? "আনলিমিটেড টেলিগ্রাম বট" : "Unlimited Telegram Bots",
        lang === "bn" ? "৮ জিবি ডেডিকেটেড মেমোরি / ৪ কোর" : "8 GB Dedicated RAM / 4 Cores",
        lang === "bn" ? "ডেডিকেটেড প্রক্সি এবং আইপি" : "Dedicated Proxies & Static IP",
        lang === "bn" ? "ওয়েবহুক সাপোর্ট ও কাস্টম ডোমেন" : "Webhook Support & Custom Domains",
        lang === "bn" ? "২৪/৭ ডেডিকেটেড ম্যানেজার সাপোর্ট" : "24/7 Dedicated Account Manager",
      ],
      isPopular: false,
      buttonText: lang === "bn" ? "বিজনেস প্ল্যান নিন" : "Get Business",
      isCurrent: false,
    },
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") return;
    const targetPlan = hostingPlans.find((p) => p.id === planId);
    if (!targetPlan) return;

    const numPrice =
      billingCycle === "monthly" ? targetPlan.numPriceMonthly : targetPlan.numPriceYearly;

    setPurchasingPlan({
      id: targetPlan.id,
      name: targetPlan.name,
      price: numPrice,
      period: billingCycle === "monthly" ? "monthly" : "yearly",
    });
  };

  const handlePurchaseSuccess = (newServer: ActiveServer, newBalance: number) => {
    onWalletUpdated?.(newBalance);
    onServerCreated?.(newServer);
    setToastMsg(
      lang === "bn"
        ? `অভিনন্দন! আপনার "${newServer.name}" সার্ভার সফলভাবে সক্রিয় হয়েছে!`
        : `Congratulations! Server "${newServer.name}" is now active and running!`
    );
    // Smoothly redirect to home to show the new server in the active list
    setTimeout(() => {
      onNavigate("/home");
    }, 1200);
  };

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
      title: lang === "bn" ? "অটো-রিস্টার্ট ও ক্র্যাশ গার্ড" : "Auto-Restart & Crash Guard",
      desc:
        lang === "bn"
          ? "যদি বট কোনো অপ্রত্যাশিত ক্র্যাশে বন্ধ হয়ে যায়, সিস্টেম স্বয়ংক্রিয়ভাবে পুনরায় চালু করার সুযোগ রাখে।"
          : "Process supervisor that monitors Telegram long-polling health and handles reconnects.",
      icon: RefreshCw,
      status: "Operational",
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: lang === "bn" ? "সিকিউর এনভায়রনমেন্ট স্টোরেজ" : "Secure Env Secrets Vault",
      desc:
        lang === "bn"
          ? "BOT_TOKEN এবং এপিআই কীগুলো সার্ভার সাইডে এনক্রিপ্ট হয়ে সংরক্ষিত থাকে।"
          : "Strict workspace isolation with encrypted token handling and isolated process boundaries.",
      icon: Shield,
      status: "Protected",
      badgeColor: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: lang === "bn" ? "হাই-স্পিড ক্লাউড ব্যান্ডউইথ" : "Low-Latency Telegram Network",
      desc:
        lang === "bn"
          ? "টেলিগ্রাম ইউরোপ ও গ্লোবাল সার্ভারের সাথে সরাসরি আল্ট্রা-ফাস্ট কানেকশন।"
          : "Direct low-latency route to Telegram MTProto core endpoints across global edge clusters.",
      icon: HardDrive,
      status: "Active",
      badgeColor: "text-teal-700 bg-teal-50 border-teal-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Services Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900">
              {lang === "bn" ? "হোস্টিং সার্ভিস ও সাবস্ক্রিপশন প্ল্যান" : "Hosting Services & Plans"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {lang === "bn"
              ? "টেলিগ্রাম বট হোস্টিংয়ের জন্য উপযুক্ত সার্ভার প্যাকেজ নির্বাচন করুন এবং বর্তমান ক্লাউড সার্ভিসের স্থিতি পর্যবেক্ষণ করুন।"
              : "Choose your bot hosting plan and monitor current cloud server operational parameters."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate("/my-servers")}
            className="px-4 py-2 bg-[#5438dc] hover:bg-[#472ecc] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Server className="w-4 h-4" />
            <span>{lang === "bn" ? "আমার সার্ভারসমূহ" : "My Servers"}</span>
          </button>
          <button
            onClick={() => onNavigate("/billing")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === "bn" ? "ওয়ালেট ও রিচার্জ" : "Wallet & Add Funds"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <span>{toastMsg}</span>
          <button
            onClick={() => onNavigate("/billing")}
            className="underline font-bold text-indigo-700 ml-3 shrink-0"
          >
            {lang === "bn" ? "ওয়ালেটে যান" : "Go to Wallet"}
          </button>
        </div>
      )}

      {/* SECTION: HOSTING & SUBSCRIPTION PLANS */}
      <section id="hosting-plans" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>{lang === "bn" ? "টেলিগ্রাম বট হোস্টিং প্ল্যান" : "Telegram Bot Hosting Plans"}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "bn"
                ? "আপনার বটের ট্রাফিকের ওপর ভিত্তি করে সেরা প্ল্যানটি বেছে নিন।"
                : "Select the ideal tier based on your bot's traffic and requirements."}
            </p>
          </div>

          {/* Billing Interval Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs self-start">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {lang === "bn" ? "মাসিক বিলিং" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{lang === "bn" ? "বাৎসরিক" : "Yearly"}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                {lang === "bn" ? "২০% ছাড়" : "Save 20%"}
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {hostingPlans.map((plan) => {
            const isPlanSelected = selectedPlan === plan.id;
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-white border p-6 flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? "border-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                    : isPlanSelected
                    ? "border-sky-500 shadow-md ring-1 ring-sky-500/20"
                    : "border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                    {lang === "bn" ? "জনপ্রিয় পছন্দ" : "Most Popular"}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    {plan.isCurrent && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {lang === "bn" ? "বর্তমান" : "Current"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[36px]">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-5 pb-5 border-b border-slate-100">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {plan.id === "free"
                        ? plan.period
                        : billingCycle === "monthly"
                        ? (lang === "bn" ? "/ মাস" : "/ mo")
                        : (lang === "bn" ? "/ বছর" : "/ yr")}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 mb-6">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      {lang === "bn" ? "প্যাকেজে অন্তর্ভুক্ত:" : "Included Features:"}
                    </span>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={plan.isCurrent}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    plan.isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : plan.isPopular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95"
                      : "bg-slate-900 hover:bg-slate-800 text-white active:scale-95"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION: RUNTIME CLOUD SERVICES */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-600" />
            <span>{lang === "bn" ? "ক্লাউড স্যান্ডবক্স আর্কিটেকচার" : "Cloud Sandbox Infrastructure"}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {lang === "bn"
              ? "বটের স্থিতিশীলতা নিশ্চিতে ব্যাকগ্রাউন্ডে সক্রিয় সার্ভার মডিউলগুলো:"
              : "Core runtime architecture powering your 24/7 background bots:"}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicesList.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
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
      </section>

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

      {/* Purchase Details Modal matching user design */}
      <PurchasePlanModal
        isOpen={Boolean(purchasingPlan)}
        plan={purchasingPlan}
        walletBalance={walletBalance}
        lang={lang}
        onClose={() => setPurchasingPlan(null)}
        onSuccess={handlePurchaseSuccess}
        onNavigate={onNavigate}
        onAddNotification={onAddNotification}
      />
    </div>
  );
};
