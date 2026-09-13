import React, { useState } from "react";
import { Sparkles, Bot, Layers, Zap, Loader2 } from "lucide-react";
import { StarterTemplate } from "../types";

interface TemplateSelectorProps {
  lang: "bn" | "en";
  onLoadTemplate: (templateId: string) => Promise<void>;
}

const TEMPLATES: StarterTemplate[] = [
  {
    id: "telebot_echo",
    name: "Echo & Help Bot",
    nameBn: "ইকো ও হেল্প বট",
    description: "Fast Telegram bot using pyTelegramBotAPI that replies to messages and commands.",
    descriptionBn: "সহজ এবং দ্রুত টেলিগ্রাম বট (pyTelegramBotAPI), যা মেসেজ এবং কমান্ডের রিপ্লাই দেয়।",
    badge: "Beginner Friendly",
  },
  {
    id: "inline_button_bot",
    name: "Inline Buttons Menu",
    nameBn: "ইনলাইন বাটন মেনু বট",
    description: "Interactive menu with clickable inline keyboard buttons and callback handlers.",
    descriptionBn: "ক্লিকযোগ্য ইনলাইন বাটন ও মেনু সহ ইন্টারঅ্যাক্টিভ টেলিগ্রাম বট।",
    badge: "Interactive UI",
  },
  {
    id: "ptb_async_bot",
    name: "Async Modern Bot",
    nameBn: "অ্যাসিঙ্ক মডার্ন বট",
    description: "High-performance async bot built with python-telegram-bot v20+ framework.",
    descriptionBn: "python-telegram-bot v20+ দিয়ে তৈরি আধুনিক হাই-পারফরম্যান্স অ্যাসিঙ্ক বট।",
    badge: "Advanced Async",
  },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  lang,
  onLoadTemplate,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    try {
      await onLoadTemplate(id);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div id="templates-card" className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === "bn" ? "প্রস্তুত বট টেমপ্লেট" : "Ready-to-run Bot Templates"}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "bn"
                ? "কোড না লিখে এখনই একটি রেডিমেড বট সিলেক্ট করে টেস্ট করতে পারেন"
                : "Select a pre-configured bot template to test immediately without writing code"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 flex flex-col justify-between bg-slate-50/40 hover:bg-indigo-50/20 transition-all text-left"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  {tpl.id === "telebot_echo" && <Bot className="w-3.5 h-3.5 text-sky-600" />}
                  {tpl.id === "inline_button_bot" && <Layers className="w-3.5 h-3.5 text-indigo-600" />}
                  {tpl.id === "ptb_async_bot" && <Zap className="w-3.5 h-3.5 text-amber-600" />}
                  {lang === "bn" ? tpl.nameBn : tpl.name}
                </span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                  {tpl.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "bn" ? tpl.descriptionBn : tpl.description}
              </p>
            </div>

            <button
              onClick={() => handleSelect(tpl.id)}
              disabled={Boolean(loadingId)}
              className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-indigo-600 hover:text-white border border-slate-300 hover:border-indigo-600 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              {loadingId === tpl.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{lang === "bn" ? "এই টেমপ্লেট লোড করুন" : "Load Template"}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
