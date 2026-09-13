import React, { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Clock,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

interface BillingPageViewProps {
  lang: "bn" | "en";
  onNavigate: (route: string) => void;
}

export const BillingPageView: React.FC<BillingPageViewProps> = ({
  lang,
  onNavigate,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const plans = [
    {
      id: "free",
      name: lang === "bn" ? "ফ্রি স্টার্টার" : "Free Starter",
      priceMonthly: "৳ 0",
      priceYearly: "৳ 0",
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
      buttonText: lang === "bn" ? "বর্তমান প্ল্যান (সক্রিয়)" : "Current Active Plan",
      disabled: true,
    },
    {
      id: "pro",
      name: lang === "bn" ? "প্রো ডেভেলপার" : "Pro Developer",
      priceMonthly: "৳ ২৯৯",
      priceYearly: "৳ ২,৯৯০",
      period: lang === "bn" ? "/ মাস" : "/ month",
      description:
        lang === "bn"
          ? "২৪/৭ নিরবচ্ছিন্ন হোস্টিং এবং ভারী ডেটা প্রসেসিং বটের জন্য।"
          : "For production Telegram bots requiring 24/7 uptime & fast processing.",
      features: [
        lang === "bn" ? "৫টি যুগপত টেলিগ্রাম বট" : "5 Simultaneous Telegram Bots",
        lang === "bn" ? "২ জিবি হাই-স্পিড মেমোরি" : "2 GB High-Speed Memory",
        lang === "bn" ? "অটো-রিস্টার্ট ক্র্যাশ গার্ড" : "Auto-restart Crash Protection",
        lang === "bn" ? "কাস্টম ডোমেইন ও ওয়েবহুক" : "Custom Webhooks & Custom Domains",
        lang === "bn" ? "২৪/৭ প্রায়োরিটি সাপোর্ট" : "24/7 Priority Support",
      ],
      isPopular: true,
      buttonText: lang === "bn" ? "প্রো প্ল্যানে আপগ্রেড" : "Upgrade to Pro",
      disabled: false,
    },
    {
      id: "business",
      name: lang === "bn" ? "বিজনেস ক্লাউড" : "Business Cloud",
      priceMonthly: "৳ ৯৯৯",
      priceYearly: "৳ ৯,৯৯০",
      period: lang === "bn" ? "/ মাস" : "/ month",
      description:
        lang === "bn"
          ? "উচ্চ ট্রাফিকযুক্ত টেলিগ্রাম চ্যানেল ও গ্রুপের স্বয়ংক্রিয় বট।"
          : "High-throughput bots for active channels, payments, and enterprise workflows.",
      features: [
        lang === "bn" ? "আনলিমিটেড টেলিগ্রাম বট" : "Unlimited Telegram Bots",
        lang === "bn" ? "৮ জিবি ডেডিকেটেড র্যাম" : "8 GB Dedicated RAM",
        lang === "bn" ? "ডেডিকেটেড আইপি এড্রেস" : "Dedicated IP Address",
        lang === "bn" ? "এসএলএ ৯৯.৯৯% গ্যারান্টি" : "99.99% Uptime SLA",
        lang === "bn" ? "টেলিগ্রাম গ্রুপ ও ডিরেক্ট সাপোর্ট" : "Dedicated Tech Support",
      ],
      isPopular: false,
      buttonText: lang === "bn" ? "বিজনেস প্ল্যান নিন" : "Contact Business",
      disabled: false,
    },
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setToastMsg(
      lang === "bn"
        ? `প্ল্যান নির্বাচন সফল হয়েছে: ${planId.toUpperCase()}। ধন্যবাদ!`
        : `Plan selected: ${planId.toUpperCase()}! Your billing preferences are updated.`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 mb-3">
          <CreditCard className="w-3.5 h-3.5" />
          <span>{lang === "bn" ? "স্বচ্ছ ও সাশ্রয়ী বিলিং" : "Transparent & Flexible Billing"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {lang === "bn" ? "আপনার টেলিগ্রাম বটের জন্য উপযুক্ত প্ল্যান" : "Choose the Right Plan for Your Bot"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          {lang === "bn"
            ? "বিনামূল্যে শুরু করুন, প্রয়োজন অনুযায়ী আপগ্রেড করুন। কোনো লুকানো চার্জ নেই।"
            : "Start completely free. Scale smoothly as your Telegram bot users and workload grow."}
        </p>

        {/* Cycle Toggle */}
        <div className="mt-5 inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {lang === "bn" ? "মাসিক বিলিং" : "Monthly"}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>{lang === "bn" ? "বার্ষিক বিলিং" : "Yearly"}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isPro = plan.isPopular;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 transition-all flex flex-col justify-between relative ${
                isPro
                  ? "bg-slate-900 text-white border-2 border-sky-500 shadow-lg scale-102"
                  : "bg-white text-slate-900 border border-slate-200 shadow-xs"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  {lang === "bn" ? "সর্বাধিক জনপ্রিয়" : "Most Popular"}
                </div>
              )}

              <div>
                <h3 className={`text-base font-bold ${isPro ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mt-1 min-h-[36px] ${isPro ? "text-slate-300" : "text-slate-500"}`}>
                  {plan.description}
                </p>

                <div className="my-5 flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${isPro ? "text-white" : "text-slate-900"}`}>
                    {billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                  </span>
                  <span className={`text-xs ${isPro ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 my-6 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isPro ? "text-sky-400" : "text-emerald-500"
                        }`}
                      />
                      <span className={isPro ? "text-slate-200" : "text-slate-600"}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={plan.disabled && selectedPlan === plan.id}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isPro
                    ? "bg-sky-500 hover:bg-sky-400 text-white shadow-md active:scale-98"
                    : selectedPlan === plan.id
                    ? "bg-slate-100 text-slate-500 cursor-default"
                    : "bg-slate-900 hover:bg-slate-800 text-white active:scale-98"
                }`}
              >
                {selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {lang === "bn" ? "বর্তমান প্ল্যান" : "Current Plan"}
                  </span>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment methods & Guarantee */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>
            {lang === "bn"
              ? "বিকাশ, নগদ, রকেট, কার্ড এবং ক্রিপ্টো পেমেন্ট গ্রহণযোগ্য。"
              : "bKash, Nagad, Rocket, Credit/Debit Cards & Crypto accepted."}
          </span>
        </div>
        <div className="flex items-center gap-3 font-medium text-slate-600">
          <span>🔒 256-bit SSL</span>
          <span>•</span>
          <span>⚡ Instant Activation</span>
        </div>
      </div>
    </div>
  );
};
