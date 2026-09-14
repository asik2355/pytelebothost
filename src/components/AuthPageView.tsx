import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Bot,
  Server,
  ArrowLeft,
  Send,
  AlertCircle,
} from "lucide-react";
import { AuthUser } from "../types";

interface AuthPageViewProps {
  initialMode: "login" | "registration";
  lang: "bn" | "en";
  onAuthSuccess: (user: AuthUser) => void;
  onNavigate: (route: string) => void;
}

export const AuthPageView: React.FC<AuthPageViewProps> = ({
  initialMode,
  lang,
  onAuthSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<"login" | "registration">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  // Sync mode with props if changed externally
  React.useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode]);

  const handleModeSwitch = (newMode: "login" | "registration") => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    onNavigate(newMode === "login" ? "/login" : "/registration");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(
        lang === "bn" ? "দয়া করে ইমেইল অ্যাড্রেস লিখুন।" : "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        lang === "bn" ? "দয়া করে আপনার পাসওয়ার্ড লিখুন।" : "Please enter your password."
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Check existing stored user or create session
      let existingUsers: AuthUser[] = [];
      try {
        const stored = localStorage.getItem("hostbot_registered_users");
        if (stored) existingUsers = JSON.parse(stored);
      } catch {
        // ignore
      }

      const foundUser = existingUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      const loggedInUser: AuthUser = foundUser || {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: email.split("@")[0] || "Alif Sheikh",
        email: email.trim(),
        telegramUsername: "@" + (email.split("@")[0] || "botuser"),
        role: "user",
        createdAt: new Date().toISOString(),
      };

      setSuccessMessage(
        lang === "bn"
          ? "সফলভাবে লগইন হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে..."
          : "Logged in successfully! Redirecting to dashboard..."
      );

      setTimeout(() => {
        onAuthSuccess(loggedInUser);
        onNavigate("/home");
      }, 700);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(
        lang === "bn" ? "দয়া করে আপনার নাম লিখুন।" : "Please enter your full name."
      );
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage(
        lang === "bn" ? "একটি সঠিক ইমেইল প্রদান করুন।" : "Please enter a valid email address."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        lang === "bn"
          ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        lang === "bn" ? "পাসওয়ার্ড দুটি মেলেনি।" : "Passwords do not match."
      );
      return;
    }

    if (!agreeTerms) {
      setErrorMessage(
        lang === "bn"
          ? "শর্তাবলী ও নীতিমালা গ্রহণ করা আবশ্যক।"
          : "You must accept Terms of Service & Privacy Policy."
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const newUser: AuthUser = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        email: email.trim(),
        telegramUsername: telegramUsername.trim()
          ? telegramUsername.startsWith("@")
            ? telegramUsername.trim()
            : "@" + telegramUsername.trim()
          : undefined,
        role: "user",
        createdAt: new Date().toISOString(),
      };

      // Store in users list
      try {
        let existingUsers: AuthUser[] = [];
        const stored = localStorage.getItem("hostbot_registered_users");
        if (stored) existingUsers = JSON.parse(stored);
        existingUsers.push(newUser);
        localStorage.setItem("hostbot_registered_users", JSON.stringify(existingUsers));
      } catch {
        // ignore
      }

      setSuccessMessage(
        lang === "bn"
          ? "রেজিস্ট্রেশন সফল হয়েছে! স্বাগতম bot-host.xyz-এ।"
          : "Account created successfully! Welcome to bot-host.xyz."
      );

      setTimeout(() => {
        onAuthSuccess(newUser);
        onNavigate("/home");
      }, 700);
    }, 900);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Home Link */}
      <div className="max-w-4xl mx-auto w-full mb-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate("/home")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === "bn" ? "ড্যাশবোর্ডে ফিরে যান" : "Back to Console"}</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Left Col: Brand Presentation & Highlights (Visible on Desktop/Tablet) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-white text-lg tracking-tight font-sans block">
                  bot-host.xyz
                </span>
                <span className="text-[10px] text-indigo-300 font-medium tracking-wide">
                  CLOUD TELEGRAM BOT HOSTING
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {mode === "login"
                ? lang === "bn"
                  ? "আপনার বট ড্যাশবোর্ডে প্রবেশ করুন"
                  : "Welcome Back to Your Bot Cloud"
                : lang === "bn"
                ? "খুব সহজে একাউন্ট তৈরি করে বট রান করুন"
                : "Create Your Account & Deploy Instantly"}
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {lang === "bn"
                ? "হাই-স্পিড NVMe সার্ভার, ২৪/৭ আপটাইম এবং অটোমেটেড টেলিগ্রাম বট এক্সিকিউশন প্ল্যাটফর্ম।"
                : "High-performance Python, Node.js & Go bot runners with instant bKash/Nagad billing."}
            </p>

            {/* Feature Pills */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">1-Click Bot Startup</span>
                  <span className="text-[11px] text-slate-400">
                    {lang === "bn" ? "কাস্টম রিপো ও ফাইল রানার" : "Run custom Python & Node bots"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">99.9% Uptime Guarantee</span>
                  <span className="text-[11px] text-slate-400">
                    {lang === "bn" ? "অবিরাম রানিং ব্যাকগ্রাউন্ড প্রসেস" : "Always-on isolated containers"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Server className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Instant Auto Billing</span>
                  <span className="text-[11px] text-slate-400">
                    {lang === "bn" ? "বিকাশ ও নগদ স্বয়ংক্রিয় রিচার্জ" : "Pay as low as ৳50/month"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>© 2026 bot-host.xyz</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Servers Online
            </span>
          </div>
        </div>

        {/* Right Col: Authentication Forms */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          {/* Header Switcher Tabs */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleModeSwitch("login")}
                className={`text-sm font-bold pb-1 cursor-pointer transition-colors relative ${
                  mode === "login"
                    ? "text-[#5a36db] after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-0.5 after:bg-[#5a36db]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "bn" ? "লগইন (Login)" : "Sign In"}
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={() => handleModeSwitch("registration")}
                className={`text-sm font-bold pb-1 cursor-pointer transition-colors relative ${
                  mode === "registration"
                    ? "text-[#5a36db] after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-0.5 after:bg-[#5a36db]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "bn" ? "রেজিস্ট্রেশন (Sign Up)" : "Create Account"}
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === "bn" ? "ইমেইল বা ইউজারনেম" : "Email Address"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "bn" ? "পাসওয়ার্ড" : "Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordModal(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    {lang === "bn" ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot Password?"}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{lang === "bn" ? "আমাকে মনে রাখুন" : "Remember me"}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#5a36db] to-[#6f42ec] hover:from-[#4f2cc7] hover:to-[#5e35db] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === "bn" ? "যাচাই করা হচ্ছে..." : "Signing in..."}</span>
                  </span>
                ) : (
                  <>
                    <span>{lang === "bn" ? "লগইন করুন" : "Sign In to Dashboard"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Toggle to Registration */}
              <div className="text-center pt-3 text-xs text-slate-500">
                <span>
                  {lang === "bn" ? "একাউন্ট নেই? " : "Don't have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("registration")}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {lang === "bn" ? "নতুন একাউন্ট খুলুন" : "Sign Up Free"}
                </button>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "bn" ? "আপনার পূর্ণ নাম" : "Full Name"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alif Sheikh"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "bn" ? "ইমেইল অ্যাড্রেস" : "Email Address"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Optional Telegram Username */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "bn" ? "টেলিগ্রাম ইউজারনেম" : "Telegram Username"}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {lang === "bn" ? "(ঐচ্ছিক / Optional)" : "(Optional for Bot alerts)"}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@your_telegram_id"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Passwords in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "bn" ? "পাসওয়ার্ড" : "Password"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "bn" ? "পুনরায় পাসওয়ার্ড" : "Confirm"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <span>
                    {lang === "bn" ? (
                      <>
                        আমি bot-host.xyz এর{" "}
                        <span className="text-indigo-600 font-semibold underline">শর্তাবলী</span>{" "}
                        এবং <span className="text-indigo-600 font-semibold underline">প্রাইভেসি পলিসি</span> মেনে চলব।
                      </>
                    ) : (
                      <>
                        I agree to bot-host.xyz{" "}
                        <span className="text-indigo-600 font-semibold underline">Terms of Service</span>{" "}
                        and{" "}
                        <span className="text-indigo-600 font-semibold underline">Privacy Policy</span>.
                      </>
                    )}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#5a36db] to-[#6f42ec] hover:from-[#4f2cc7] hover:to-[#5e35db] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === "bn" ? "একাউন্ট তৈরি হচ্ছে..." : "Creating Account..."}</span>
                  </span>
                ) : (
                  <>
                    <span>{lang === "bn" ? "একাউন্ট তৈরি করুন" : "Register Free Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Toggle to Login */}
              <div className="text-center pt-2 text-xs text-slate-500">
                <span>
                  {lang === "bn" ? "আগে থেকেই একাউন্ট আছে? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {lang === "bn" ? "লগইন করুন" : "Log In"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {lang === "bn" ? "পাসওয়ার্ড পুনরুদ্ধার" : "Reset Password"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === "bn"
                ? "আপনার রেজিস্টার্ড ইমেইল অ্যাড্রেস লিখুন। আমরা রিকভারি লিংক পাঠিয়ে দেব।"
                : "Enter your registered email address to receive password reset instructions."}
            </p>

            {forgotSuccess ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  {lang === "bn"
                    ? "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!"
                    : "Password reset link sent to your email successfully!"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  {lang === "bn" ? "ঠিক আছে" : "Done"}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotEmail) setForgotSuccess(true);
                }}
                className="space-y-3"
              >
                <div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordModal(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                  >
                    {lang === "bn" ? "লিংক পাঠান" : "Send Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
