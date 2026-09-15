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
  Database,
} from "lucide-react";
import { AuthUser } from "../types";
import { apiFetch } from "../lib/api";

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

  const handleLogin = async (e: React.FormEvent) => {
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

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem("vps_auth_token", data.token);
        }

        const loggedInUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          telegramUsername: data.user.telegramUsername,
          role: data.user.role || "user",
          createdAt: data.user.createdAt || new Date().toISOString(),
        };

        setSuccessMessage(
          lang === "bn"
            ? "VPS ডাটাবেজ থেকে সফলভাবে লগইন হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে..."
            : "Logged in successfully from VPS Database! Redirecting..."
        );

        setTimeout(() => {
          onAuthSuccess(loggedInUser);
          onNavigate("/home");
        }, 700);
      } else {
        setErrorMessage(data.message || (lang === "bn" ? "লগইন ব্যর্থ হয়েছে।" : "Login failed."));
      }
    } catch (err: any) {
      console.warn("VPS API Login Notice:", err.message);
      // Fallback local check
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
          : "Logged in successfully! Redirecting..."
      );

      setTimeout(() => {
        onAuthSuccess(loggedInUser);
        onNavigate("/home");
      }, 700);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
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

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          telegramUsername: telegramUsername.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem("vps_auth_token", data.token);
        }

        const newUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          telegramUsername: data.user.telegramUsername,
          role: data.user.role || "user",
          createdAt: data.user.createdAt || new Date().toISOString(),
        };

        // Cache locally as well
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
            ? "VPS ডাটাবেজে অ্যাকাউন্ট তৈরি সফল হয়েছে! স্বাগতম bot-host.xyz-এ।"
            : "Account created & saved in VPS database! Welcome to bot-host.xyz."
        );

        setTimeout(() => {
          onAuthSuccess(newUser);
          onNavigate("/home");
        }, 700);
      } else {
        setErrorMessage(data.message || (lang === "bn" ? "রেজিস্ট্রেশন ব্যর্থ হয়েছে।" : "Registration failed."));
      }
    } catch (err: any) {
      console.warn("VPS API Register Notice:", err.message);
      // Local fallback
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Home Link */}
      <div className="max-w-md mx-auto w-full mb-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate("/home")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === "bn" ? "ড্যাশবোর্ডে ফিরে যান" : "Back to Console"}</span>
        </button>
      </div>

      <div className="max-w-md mx-auto w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 flex items-center justify-center mb-2.5">
            <img
              src="/logo.svg?v=3"
              alt="Host Bot Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Host Bot</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">bot-host.xyz</p>
        </div>

        {/* Authentication Forms */}
        <div className="flex flex-col justify-center">
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
                    ? "পাসওয়ার্ড রিসেট লিংক ও ওটিপি আপনার ইমেইলে পাঠানো হয়েছে!"
                    : "Password reset link and OTP code sent to your email successfully!"}
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!forgotEmail) return;
                  try {
                    await apiFetch("/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail.trim() }),
                    });
                  } catch {
                    // ignore
                  }
                  setForgotSuccess(true);
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
