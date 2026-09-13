import React, { useState } from "react";
import {
  ShoppingBag,
  Download,
  Sparkles,
  Bot,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Code2,
  Zap,
} from "lucide-react";

interface BotStorePageViewProps {
  lang: "bn" | "en";
  onLoadTemplate: (templateId: string) => Promise<void>;
  onNavigate: (route: string) => void;
  isLoading: boolean;
}

export const BotStorePageView: React.FC<BotStorePageViewProps> = ({
  lang,
  onLoadTemplate,
  onNavigate,
  isLoading,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [deployedId, setDeployedId] = useState<string | null>(null);

  const templates = [
    {
      id: "echo",
      name: lang === "bn" ? "টেলিগ্রাম ইকো বট (Echo Bot)" : "Telegram Echo Bot",
      category: "basic",
      badge: "Starter",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      description:
        lang === "bn"
          ? "সহজ ইকো বট। ইউজার যা মেসেজ পাঠাবে ঠিক সেটাই রিপ্লাই দেবে। নতুনদের জন্য আদর্শ।"
          : "Simple echo bot that repeats whatever message the user sends. Great foundation for beginners.",
      framework: "python-telegram-bot v20+",
      features: [
        "/start এবং /help কমান্ড হ্যান্ডলার",
        "টেক্সট মেসেজ রিফ্লেকশন",
        "সহজ কনফিগারেশন",
      ],
      author: "Official",
      downloads: "1.4k",
    },
    {
      id: "inline_buttons",
      name: lang === "bn" ? "ইনলাইন বাটন মেনু বট" : "Inline Keyboard Menu Bot",
      category: "interactive",
      badge: "Popular",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      description:
        lang === "bn"
          ? "আকর্ষণীয় ক্লিকযোগ্য ইনলাইন বাটন এবং মেনু সহ বট। কলব্যাক কোয়েরি হ্যান্ডলিং অন্তর্ভুক্ত।"
          : "Interactive inline buttons and navigation keyboard with instant callback query responses.",
      framework: "python-telegram-bot v20+",
      features: [
        "ডায়নামিক ইনলাইন কিবোর্ড",
        "CallbackQueryHandler ইন্টিগ্রেশন",
        "ইউজার ইন্টারফেস মেনু",
      ],
      author: "Official",
      downloads: "2.1k",
    },
    {
      id: "telebot_simple",
      name: lang === "bn" ? "টেলিবট লাইব্রেরি বট (PyTelegramBotAPI)" : "PyTelegramBotAPI Bot",
      category: "basic",
      badge: "Lightweight",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description:
        lang === "bn"
          ? "সহজ PyTelegramBotAPI কোড কাঠামো। কম মেমোরি ব্যবহারে দ্রুত মেসেজ রিপ্লাই।"
          : "Lightweight telebot framework code with straightforward message decorators and fast response.",
      framework: "pyTelegramBotAPI 4.14+",
      features: [
        "@bot.message_handler ডেকোরেটর",
        "ফটো এবং ডকুমেন্ট হ্যান্ডলিং",
        "দ্রুত ডিপ্লয়মেন্ট",
      ],
      author: "Community",
      downloads: "980",
    },
    {
      id: "ai_assistant",
      name: lang === "bn" ? "এআই স্মার্ট বট (AI Chat Bot)" : "AI Assistant Bot",
      category: "ai",
      badge: "AI Powered",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      description:
        lang === "bn"
          ? "টেলিগ্রাম গ্রুপ বা ইনবক্সে যেকোনো প্রশ্নের উত্তর দেওয়ার মতো এআই অ্যাসিস্ট্যান্ট বট।"
          : "Smart assistant bot template designed to integrate with AI completions and Q&A workflows.",
      framework: "python-telegram-bot + Async",
      features: [
        "স্মার্ট প্রম্পট রেসপন্স",
        "কনটেক্সট সংরক্ষণ",
        "গ্রুপ চ্যাট মোড",
      ],
      author: "Telegram Labs",
      downloads: "3.2k",
    },
    {
      id: "channel_auto_post",
      name: lang === "bn" ? "চ্যানেল অটো-পোস্টার বট" : "Channel Auto-Poster Bot",
      category: "utility",
      badge: "Utility",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      description:
        lang === "bn"
          ? "নির্দিষ্ট সময়ে চ্যানেলে স্বয়ংক্রিয়ভাবে মেসেজ, ছবি এবং ঘোষণা পোস্ট করার বট।"
          : "Scheduled publisher that automatically broadcasts posts, images, and announcements to channels.",
      framework: "python-telegram-bot + APScheduler",
      features: [
        "চ্যানেল ব্রডকাস্ট",
        "টাইমার এবং শিডিউলিং",
        "মিডিয়া ক্যাপশন সাপোর্ট",
      ],
      author: "Community",
      downloads: "850",
    },
    {
      id: "admin_moderator",
      name: lang === "bn" ? "গ্রুপ মডারেটর ও অ্যান্টি-স্প্যাম" : "Group Moderator & Anti-Spam",
      category: "utility",
      badge: "Protection",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      description:
        lang === "bn"
          ? "গ্রুপের নতুন মেম্বারকে স্বাগতম জানানো এবং স্প্যাম লিংক অটো-রিমুভ করার নির্ভরযোগ্য বট।"
          : "Auto-welcome new users and automatically filter unsolicited links or spam in your Telegram groups.",
      framework: "python-telegram-bot v20+",
      features: [
        "নতুন সদস্য ওয়েলকাম মেসেজ",
        "লিঙ্ক ব্লকার ও স্প্যাম ফিল্টার",
        "অ্যাডমিন মিউট/ব্যান কমান্ড",
      ],
      author: "Official",
      downloads: "1.8k",
    },
  ];

  const filteredTemplates =
    activeFilter === "all"
      ? templates
      : templates.filter((t) => t.category === activeFilter);

  const handleDeploy = async (templateId: string) => {
    setDeployedId(templateId);
    // Standard template IDs handled by backend
    const targetId =
      templateId === "telebot_simple"
        ? "telebot_simple"
        : templateId === "inline_buttons"
        ? "inline_buttons"
        : "echo";

    await onLoadTemplate(targetId);
    // Navigate to home workspace
    onNavigate("/home");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "রেডিমেড বট লাইব্রেরি" : "Ready-to-Deploy Bots"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {lang === "bn" ? "বট স্টোর (Telegram Bot Store)" : "Telegram Bot Store"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "bn"
                ? "কোড লেখার দরকার নেই! রেডিমেড প্রজেক্ট এক ক্লিকে আপনার রানারে ইনস্টল করে চালু করুন।"
                : "Explore pre-built, tested Telegram bot templates. Install and run in 1-click."}
            </p>
          </div>

          <button
            onClick={() => onNavigate("/home")}
            className="self-start sm:self-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <Code2 className="w-4 h-4" />
            <span>{lang === "bn" ? "কাস্টম কোড আপলোড" : "Upload Custom Code"}</span>
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: lang === "bn" ? "সবগুলো বট" : "All Bots" },
            { id: "basic", label: lang === "bn" ? "স্টার্টার ও ইকো" : "Starters & Echo" },
            { id: "interactive", label: lang === "bn" ? "বাটন ও মেনু" : "Interactive Menus" },
            { id: "ai", label: lang === "bn" ? "এআই বট" : "AI Powered" },
            { id: "utility", label: lang === "bn" ? "ইউটিলিটি ও গ্রুপ" : "Utilities & Groups" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeFilter === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-sky-300 hover:shadow-sm transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${t.badgeColor}`}>
                  {t.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {t.downloads} {lang === "bn" ? "ব্যবহার" : "installs"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                {t.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed min-h-[38px]">
                {t.description}
              </p>

              <div className="my-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mb-2">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>{t.framework}</span>
                </div>
                {t.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleDeploy(t.id)}
              disabled={isLoading}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {deployedId === t.id && isLoading
                  ? lang === "bn"
                    ? "ইনস্টল হচ্ছে..."
                    : "Installing..."
                  : lang === "bn"
                  ? "রানের জন্য ইনস্টল করুন"
                  : "Install & Open in Runner"}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
