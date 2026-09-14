import React, { useState, useEffect } from "react";
import {
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  CreditCard,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Clock,
  History,
  Check,
} from "lucide-react";

import { AppNotification, AuthUser } from "../types";
import { Lock, LogIn, UserPlus } from "lucide-react";

interface BillingPageViewProps {
  lang: "bn" | "en";
  currentUser?: AuthUser | null;
  onNavigate: (route: string) => void;
  onWalletUpdated?: (newBalance: number) => void;
  onAddNotification?: (notif: AppNotification) => void;
}

interface WalletInfo {
  balance: number;
  currency: string;
  transactions: Array<{
    id: string;
    amount: number;
    type: "deposit" | "charge";
    description: string;
    date: string;
    status: "completed" | "pending";
    method?: string;
  }>;
}

export const BillingPageView: React.FC<BillingPageViewProps> = ({
  lang,
  currentUser,
  onNavigate,
  onWalletUpdated,
  onAddNotification,
}) => {
  const [wallet, setWallet] = useState<WalletInfo>({
    balance: 0.00,
    currency: "৳",
    transactions: [],
  });
  const [rechargeAmount, setRechargeAmount] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("bKash");

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/billing/wallet");
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleAmountChange = (val: number) => {
    const clamped = Math.max(0, val);
    setRechargeAmount(clamped);
    setInputVal(clamped.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    const parsed = parseFloat(v);
    if (!isNaN(parsed) && parsed >= 0) {
      setRechargeAmount(parsed);
    } else {
      setRechargeAmount(0);
    }
  };

  const handleProceedPayment = async () => {
    if (!currentUser) {
      alert(
        lang === "bn"
          ? "টাকা যোগ করতে অনুগ্রহ করে আগে লগইন বা একাউন্ট তৈরি করুন।"
          : "Please sign in or create an account to add funds to your wallet."
      );
      onNavigate("/login");
      return;
    }

    if (rechargeAmount <= 0) {
      alert(lang === "bn" ? "অনুগ্রহ করে রিচার্জের পরিমাণ নির্ধারণ করুন!" : "Please enter a valid recharge amount greater than 0");
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch("/api/billing/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: rechargeAmount,
          method: selectedMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccessMsg(
          lang === "bn"
            ? `৳${rechargeAmount.toFixed(2)} সফলভাবে যোগ হয়েছে! নতুন ব্যালেন্স: ৳${data.newBalance.toFixed(2)}`
            : `৳${rechargeAmount.toFixed(2)} added successfully! New Balance: ৳${data.newBalance.toFixed(2)}`
        );
        fetchWallet();
        onWalletUpdated?.(data.newBalance);
        onAddNotification?.({
          id: `notif-tx-${Date.now()}`,
          title: "Money Added Successfully",
          titleBn: "ওয়ালেট রিচার্জ সম্পন্ন হয়েছে",
          desc: `৳${rechargeAmount.toFixed(2)} added via ${selectedMethod}. New balance: ৳${data.newBalance.toFixed(2)}`,
          descBn: `${selectedMethod} এর মাধ্যমে ৳${rechargeAmount.toFixed(2)} যোগ হয়েছে। বর্তমান ব্যালেন্স: ৳${data.newBalance.toFixed(2)}`,
          timestamp: new Date().toISOString(),
          type: "deposit",
          read: false,
          amount: rechargeAmount,
          method: selectedMethod,
          link: "/billing",
        });
        setRechargeAmount(0);
        setInputVal("0");
        setTimeout(() => setPaymentSuccessMsg(null), 5000);
      } else {
        alert(data.error || "Payment failed");
      }
    } catch {
      alert("Network error processing payment");
    } finally {
      setIsPaying(false);
    }
  };

  const currentBalance = wallet.balance;
  const newBalance = Math.round((currentBalance + rechargeAmount) * 100) / 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {lang === "bn" ? "ব্যালেন্স যোগ করুন (Add Funds)" : "Add Funds"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === "bn"
            ? "নিরবচ্ছিন্ন সার্ভিস উপভোগ করতে আপনার ওয়ালেটে ব্যালেন্স রিচার্জ করুন।"
            : "Recharge your wallet to enjoy uninterrupted services."}
        </p>
      </div>

      {/* Guest Warning / Login Gate Banner if not logged in */}
      {!currentUser && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {lang === "bn" ? "লগইন প্রয়োজন (Login Required)" : "Authentication Required"}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {lang === "bn"
                  ? "টাকা অ্যাড করতে বা ওয়ালেট ব্যবহার করতে আপনার অ্যাকাউন্টে লগইন বা রেজিস্ট্রেশন করুন।"
                  : "Please sign in or create an account to recharge balance and access your personal wallet."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onNavigate("/login")}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "লগইন" : "Sign In"}</span>
            </button>
            <button
              onClick={() => onNavigate("/registration")}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "রেজিস্টার" : "Register"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Alert */}
      {paymentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{paymentSuccessMsg}</span>
        </div>
      )}

      {/* Main Add Funds Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        {/* Label */}
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
          ENTER AMOUNT (৳)
        </label>

        {/* Stepper + Input Box */}
        <div className="flex items-center gap-3 mb-5">
          {/* Decrement Button */}
          <button
            type="button"
            onClick={() => handleAmountChange(rechargeAmount - 50)}
            className="w-14 h-14 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-700 transition-all shadow-2xs"
            aria-label="Decrease amount"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* Amount Display & Input Field */}
          <div className="flex-1 h-14 rounded-xl border-2 border-slate-900 bg-white px-4 flex items-center justify-between shadow-2xs">
            <span className="text-xl font-bold text-indigo-700 select-none">৳</span>
            <input
              type="number"
              min="0"
              step="10"
              value={inputVal}
              onChange={handleInputChange}
              className="w-full text-right text-2xl sm:text-3xl font-bold text-slate-900 focus:outline-hidden bg-transparent pr-1"
              placeholder="0"
            />
          </div>

          {/* Increment Button */}
          <button
            type="button"
            onClick={() => handleAmountChange(rechargeAmount + 50)}
            className="w-14 h-14 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-700 transition-all shadow-2xs"
            aria-label="Increase amount"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Amount Pill Selectors */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-6">
          {quickAmounts.map((amt) => {
            const isSelected = rechargeAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handleAmountChange(amt)}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200"
                }`}
              >
                {amt}
              </button>
            );
          })}
        </div>

        {/* Payment Method Selector */}
        <div className="mb-6 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Select Payment Gateway
          </span>
          <div className="grid grid-cols-3 gap-2">
            {["bKash", "Nagad", "Card / Rocket"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMethod(m)}
                className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                  selectedMethod === m
                    ? "bg-slate-900 text-white border-slate-900 font-semibold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Proceed to Payment Button */}
        <button
          type="button"
          onClick={handleProceedPayment}
          disabled={isPaying}
          className="w-full py-3.5 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-99 disabled:opacity-60"
        >
          <span>{isPaying ? (lang === "bn" ? "প্রক্রিয়াকরণ হচ্ছে..." : "Processing Payment...") : (lang === "bn" ? "পেমেন্ট সম্পন্ন করুন" : "Proceed to Payment")}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Info Card 1: Secure Payments */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Secure Payments</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Your transactions are protected by industry-leading encryption.
          </p>
        </div>
      </div>

      {/* Info Card 2: Instant Credit */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Instant Credit</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Funds are typically added to your wallet immediately after successful verification.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-4 h-4 text-slate-600" />
          <h3 className="text-base font-bold text-slate-900">Summary</h3>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Current Balance</span>
            <span className="font-mono font-bold text-slate-900">
              ৳{currentBalance.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Recharge Amount</span>
            <span className="font-mono font-semibold text-indigo-600">
              ৳{rechargeAmount.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">New Balance</span>
            <span className="text-lg font-mono font-extrabold text-indigo-600">
              ৳{newBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Program Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {lang === "bn" ? "রেফারেল প্রোগ্রাম (১০% লাইফটাইম কমিশন)" : "Referral Program (10% Lifetime Bonus)"}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === "bn"
                ? "বন্ধুদের রেফার করে প্রতি রিচার্জে ১০% ক্যাশ বোনাস পান।"
                : "Invite friends to recharge and earn 10% instant balance commission."}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("/referral")}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer transition-all shadow-2xs active:scale-95"
        >
          {lang === "bn" ? "দেখুন" : "View Link"}
        </button>
      </div>

      {/* Need Help Bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-indigo-950">Need help?</h4>
            <p className="text-xs text-indigo-800/80 mt-0.5">
              If you encounter any issues during the recharge process, our support team is available 24/7.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            alert(lang === "bn" ? "টেলিগ্রাম সাপোর্ট: @TelegramBotRunnerSupport" : "Telegram Support: @TelegramBotRunnerSupport");
          }}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all"
          title="Chat with Support"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Recent Wallet Recharge History */}
      {wallet.transactions && wallet.transactions.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Recent Transactions
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {wallet.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{tx.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(tx.date).toLocaleString()} • {tx.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 font-mono">
                    +{wallet.currency}{tx.amount.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-400 capitalize">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
