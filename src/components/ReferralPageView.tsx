import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Users,
  Wallet,
  TrendingUp,
  Gift,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
  Award,
  HelpCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { AuthUser, AppNotification } from "../types";

interface ReferralPageViewProps {
  lang: "en" | "bn";
  currentUser: AuthUser | null;
  walletBalance: number;
  onNavigate: (route: string) => void;
  onAddNotification?: (notif: AppNotification) => void;
}

export const ReferralPageView: React.FC<ReferralPageViewProps> = ({
  lang,
  currentUser,
  walletBalance,
  onNavigate,
  onAddNotification,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const referralCode = currentUser
    ? currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, "") || currentUser.id.slice(0, 8)
    : "user";
  const referralLink = `https://bot-host.xyz/?ref=${referralCode}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (onAddNotification) {
        onAddNotification({
          id: `ref_copy_${Date.now()}`,
          title: "Referral Link Copied",
          titleBn: "রেফারেল লিংক কপি হয়েছে",
          desc: "Link copied to clipboard! Share it with your friends.",
          descBn: "আপনার রেফারেল লিংক ক্লিপবোর্ডে কপি করা হয়েছে।",
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // fallback
    }
  };

  const shareText = encodeURIComponent(
    `🚀 Host high-performance Telegram Bots (Python, Node.js, Go) on bot-host.xyz! Sign up using my referral link and get started: ${referralLink}`
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate("/home")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1.5 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{lang === "bn" ? "ড্যাশবোর্ডে ফিরুন" : "Back to Home"}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{lang === "bn" ? "রেফারেল প্রোগ্রাম" : "Referral Program"}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              10% Lifetime
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === "bn"
              ? "বন্ধুদের রেফার করে প্রতি রিচার্জ ও সার্ভার ক্রয়ে আজীবন ১০% কমিশন ইনস্ট্যান্ট ব্যালেন্স হিসেবে পান।"
              : "Invite fellow developers to bot-host.xyz and earn 10% lifetime recurring commission on every recharge."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("/billing")}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {lang === "bn" ? "ওয়ালেট: " : "Wallet: "}
              <span className="font-mono font-bold text-emerald-700">৳{walletBalance.toFixed(2)}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Custom Referral Link */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        {/* Glow Backgrounds */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-indigo-200 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === "bn" ? "আনলিমিটেড রেফারেল ইনকাম" : "Unlimited Passive Earnings"}</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === "bn"
                ? "শেয়ার করুন আপনার লিংক ও ইনকাম শুরু করুন"
                : "Share Your Link & Earn 10% Lifetime Bonus"}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 leading-relaxed">
              {lang === "bn"
                ? "আপনার রেফারেল লিংকের মাধ্যমে যে কেউ একাউন্ট খুলে হোস্টিং প্যাকেজ কিনলে অথবা ব্যালেন্স অ্যাড করলেই সাথে সাথে ১০% আপনার ওয়ালেটে জমা হবে।"
                : "Every time a referred user deposits balance or buys a server plan, you instantly get 10% added straight to your HostBot wallet balance."}
            </p>
          </div>

          {/* Referral Link Box */}
          {currentUser ? (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>{lang === "bn" ? "আপনার ইউনিক রেফারেল লিংক" : "Your Unique Referral Link"}</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900/80 border border-indigo-500/30 p-1.5 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-indigo-100 font-mono focus:outline-hidden select-all truncate"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? (lang === "bn" ? "কপি হয়েছে!" : "Copied!") : (lang === "bn" ? "কপি লিংক" : "Copy Link")}</span>
                  </button>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-colors flex items-center justify-center"
                    title="Share on Telegram"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {lang === "bn" ? "রেফারেল লিংক পেতে লগইন করুন" : "Sign In to Get Your Referral Link"}
                  </h4>
                  <p className="text-xs text-indigo-200">
                    {lang === "bn"
                      ? "আপনার পার্সোনাল রেফারেল লিংক এবং উপার্জিত ব্যালেন্স দেখতে লগইন প্রয়োজন।"
                      : "You must be logged in to generate your custom link and track commissions."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate("/login")}
                  className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-950 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {lang === "bn" ? "লগইন করুন" : "Sign In"}
                </button>
                <button
                  onClick={() => onNavigate("/registration")}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {lang === "bn" ? "রেজিস্ট্রেশন" : "Register"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === "bn" ? "মোট রেফারেল" : "Total Referrals"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {currentUser ? "0" : "--"}
          </p>
          <span className="text-[11px] text-slate-400 block">
            {lang === "bn" ? "রেজিস্টার্ড ইউজার" : "Registered users"}
          </span>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === "bn" ? "সক্রিয় গ্রাহক" : "Active Customers"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {currentUser ? "0" : "--"}
          </p>
          <span className="text-[11px] text-slate-400 block">
            {lang === "bn" ? "সার্ভার ক্রয়কারী" : "Hosting subscribers"}
          </span>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === "bn" ? "মোট ইনকাম" : "Total Earnings"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {currentUser ? "৳0.00" : "--"}
          </p>
          <span className="text-[11px] text-slate-400 block">
            {lang === "bn" ? "অর্জিত কমিশন" : "Credited to wallet"}
          </span>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === "bn" ? "কমিশন রেট" : "Commission Rate"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
            10%
          </p>
          <span className="text-[11px] text-emerald-600 font-bold block">
            {lang === "bn" ? "আজীবন রেকারিং" : "Lifetime recurring"}
          </span>
        </div>
      </div>

      {/* How It Works - 3 Step Roadmap */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === "bn" ? "রেফারেল প্রোগ্রাম কিভাবে কাজ করে?" : "How Referral Program Works"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === "bn"
              ? "৩টি সহজ ধাপে আজীবন অটোমেটিক বোনাস উপার্জন করুন"
              : "3 simple steps to earn automated lifetime revenue share"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {lang === "bn" ? "লিংক শেয়ার করুন" : "1. Share Your Link"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {lang === "bn"
                  ? "আপনার রেফারেল লিংকটি টেলিগ্রাম গ্রুপ, ফেসবুক বা ডেভেলপার বন্ধুদের সাথে শেয়ার করুন।"
                  : "Share your unique referral URL with bot creators, Telegram groups, and friends."}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {lang === "bn" ? "বন্ধু একাউন্ট খুলে রিচার্জ করবে" : "2. Friend Deploys Bot"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {lang === "bn"
                  ? "আপনার লিংকে ক্লিক করে নতুন ইউজার একাউন্ট তৈরি করে bKash/Nagad দিয়ে ব্যালেন্স রিচার্জ করবে বা সার্ভার নেবে।"
                  : "Your friend signs up, adds funds via bKash/Nagad, and deploys their bots."}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
              3
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {lang === "bn" ? "১০% ক্যাশ বোনাস বুঝে নিন" : "3. Instant 10% Cash Bonus"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {lang === "bn"
                  ? "যেকোনো সফল রিচার্জে সাথে সাথে ১০% ক্যাশব্যাক আপনার মেইন ওয়ালেটে যোগ হয়ে যাবে।"
                  : "10% of their spent balance is directly credited to your HostBot balance instantly."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === "bn" ? "প্রোগ্রামের শর্তাবলী ও প্রশ্নাবলী" : "Program Rules & FAQ"}
          </h3>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            {
              q: lang === "bn" ? "রেফারেল কমিশন কখন জমা হয়?" : "When is the commission credited?",
              a:
                lang === "bn"
                  ? "আপনার রেফার করা বন্ধু যখনই ব্যালেন্স রিচার্জ বা সার্ভার পারচেজ সম্পূর্ণ করবে, তাৎক্ষণিকভাবে আপনার HostBot ওয়ালেটে ১০% জমা হবে।"
                  : "Commission is credited instantaneously as soon as the referred user finishes their payment via bKash/Nagad.",
            },
            {
              q: lang === "bn" ? "কমিশনের টাকা কি কাজে ব্যবহার করা যায়?" : "How can I use my referral earnings?",
              a:
                lang === "bn"
                  ? "রেফারেল ব্যালেন্স দিয়ে আপনি আপনার সার্ভার রিনিউ, নতুন সার্ভার ডেপ্লয়, বট কোড স্টোর থেকে বট কেনাসহ সকল সেবা গ্রহণ করতে পারবেন।"
                  : "You can use your referral balance to deploy new cloud servers, renew existing instances, or buy bot source codes.",
            },
            {
              q: lang === "bn" ? "কমিশন কি শুধু একবার পাবো নাকি প্রতিবার?" : "Is the commission one-time or lifetime?",
              a:
                lang === "bn"
                  ? "এটি সম্পূর্ণ লাইফটাইম (Lifetime Recurring)। একজন ইউজার যতবারই রিচার্জ করবে, প্রতিবারই আপনি ১০% পাবেন।"
                  : "It is 100% lifetime recurring! Every single time that user recharges, 10% will be added to your balance.",
            },
          ].map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/60 transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left font-bold text-slate-800 flex items-center justify-between hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-90 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 text-slate-600 leading-relaxed border-t border-slate-100/60 bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
