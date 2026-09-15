import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  Send,
  AlertCircle,
} from "lucide-react";
import { AuthUser } from "../types";
import { apiFetch } from "../lib/api";
import {
  signInWithGoogleAuth,
  loginWithEmailAuth,
  registerWithEmailAuth,
  sendFirebasePasswordReset,
} from "../lib/firebase";

// Helper to format clean, branded error messages without revealing internal database or Firebase names
function formatAuthErrorMessage(err: any, lang: "bn" | "en"): string {
  if (!err) return lang === "bn" ? "একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে।" : "An unexpected error occurred.";

  const code = err.code || "";
  const rawMsg = err.message || "";

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return lang === "bn" ? "সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।" : "Sign-in popup was cancelled.";
  }

  if (code === "auth/unauthorized-domain") {
    return lang === "bn"
      ? "আপনার ডোমেইনটি অথেন্টিকেশনের জন্য অনুমোদিত নয়। দয়া করে এডমিনের সাথে যোগাযোগ করুন।"
      : "This domain is not authorized for OAuth. Please contact support.";
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found" ||
    code === "auth/invalid-email" ||
    rawMsg.includes("invalid-credential") ||
    rawMsg.includes("user-not-found") ||
    rawMsg.includes("wrong-password")
  ) {
    return lang === "bn" ? "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" : "Incorrect email or password.";
  }

  if (code === "auth/email-already-in-use") {
    return lang === "bn"
      ? "এই ইমেইলে আগেই একাউন্ট খোলা হয়েছে। দয়া করে লগইন করুন।"
      : "An account with this email already exists. Please log in.";
  }

  if (code === "auth/weak-password") {
    return lang === "bn"
      ? "পাসওয়ার্ডটি খুবই দুর্বল। শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।"
      : "Password is too weak. Please use a stronger password.";
  }

  if (code === "auth/too-many-requests") {
    return lang === "bn"
      ? "অতিরিক্ত বার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
      : "Too many failed attempts. Please try again later.";
  }

  if (code === "auth/network-request-failed" || rawMsg.toLowerCase().includes("failed to fetch")) {
    return lang === "bn"
      ? "ইমেইল অথবা পাসওয়ার্ড সঠিক নয় বা সার্ভারে সংযোগ করা যায়নি।"
      : "Invalid credentials or unable to reach auth server.";
  }

  // Strip raw "Firebase: Error (auth/...)" if present
  if (typeof rawMsg === "string" && (rawMsg.includes("Firebase:") || rawMsg.includes("auth/"))) {
    return lang === "bn"
      ? "অথেন্টিকেশনে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
      : "Authentication failed. Please try again.";
  }

  return rawMsg || (lang === "bn" ? "অপারেশন ব্যর্থ হয়েছে।" : "Operation failed.");
}

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  /**
   * 1. Google Sign-In Handler
   * - Creates profile with balance: 0 on first time
   * - Preserves balance & profile for existing users
   */
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { user, isNewUser } = await signInWithGoogleAuth();

      setSuccessMessage(
        isNewUser
          ? lang === "bn"
            ? "গুগল দিয়ে সফলভাবে অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম bot-host.xyz-এ।"
            : "Welcome! Google account created successfully."
          : lang === "bn"
          ? "গুগল দিয়ে সফলভাবে লগইন হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে..."
          : "Logged in with Google successfully! Redirecting..."
      );

      setTimeout(() => {
        onAuthSuccess(user);
        onNavigate("/home");
      }, 600);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMessage(formatAuthErrorMessage(err, lang));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * 2. Email + Password Login Handler
   */
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
      let loggedInUser: AuthUser;

      try {
        loggedInUser = await loginWithEmailAuth(email.trim(), password);
      } catch (fbErr: any) {
        // If Firebase explicitly returned an authentication failure, throw it immediately
        if (
          fbErr.code === "auth/invalid-credential" ||
          fbErr.code === "auth/wrong-password" ||
          fbErr.code === "auth/user-not-found" ||
          fbErr.code === "auth/invalid-email" ||
          fbErr.code === "auth/user-disabled" ||
          fbErr.code === "auth/too-many-requests"
        ) {
          throw fbErr;
        }

        // Only try server API if Firebase failed for unexpected network or other reasons
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

            loggedInUser = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              telegramUsername: data.user.telegramUsername,
              role: data.user.role || "user",
              balance: data.user.walletBalance ?? 0,
              createdAt: data.user.createdAt || new Date().toISOString(),
            };
          } else {
            throw fbErr;
          }
        } catch {
          // If server fetch failed (e.g. static host without /api), rethrow original auth error
          throw fbErr;
        }
      }

      setSuccessMessage(
        lang === "bn"
          ? "সফলভাবে লগইন হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে..."
          : "Logged in successfully! Redirecting..."
      );

      setTimeout(() => {
        onAuthSuccess(loggedInUser);
        onNavigate("/home");
      }, 600);
    } catch (err: any) {
      console.warn("Login Error:", err);
      setErrorMessage(formatAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 3. Email + Password Sign Up Handler
   */
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
      let newUser: AuthUser;

      try {
        newUser = await registerWithEmailAuth(
          name.trim(),
          email.trim(),
          password,
          telegramUsername.trim()
        );
      } catch (fbErr: any) {
        if (
          fbErr.code === "auth/email-already-in-use" ||
          fbErr.code === "auth/weak-password" ||
          fbErr.code === "auth/invalid-email"
        ) {
          throw fbErr;
        }

        // Fallback to server API only if not a known client-side auth error
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

            newUser = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              telegramUsername: data.user.telegramUsername,
              role: data.user.role || "user",
              balance: 0,
              createdAt: data.user.createdAt || new Date().toISOString(),
            };
          } else {
            throw fbErr;
          }
        } catch {
          throw fbErr;
        }
      }

      setSuccessMessage(
        lang === "bn"
          ? "অ্যাকাউন্ট তৈরি সফল হয়েছে! স্বাগতম bot-host.xyz-এ।"
          : "Account created successfully! Welcome to bot-host.xyz."
      );

      setTimeout(() => {
        onAuthSuccess(newUser);
        onNavigate("/home");
      }, 600);
    } catch (err: any) {
      console.warn("Register Error:", err);
      setErrorMessage(formatAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 4. Forgot Password Handler
   */
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsLoading(true);
    try {
      await sendFirebasePasswordReset(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      try {
        await apiFetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail.trim() }),
        });
        setForgotSuccess(true);
      } catch {
        setErrorMessage(formatAuthErrorMessage(err, lang));
      }
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
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

          {/* Continue with Google Button */}
          <button
            type="button"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {isGoogleLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                <span>{lang === "bn" ? "গুগল ভেরিফিকেশন হচ্ছে..." : "Connecting Google..."}</span>
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>
                  {mode === "login"
                    ? lang === "bn"
                      ? "Continue with Google"
                      : "Continue with Google"
                    : lang === "bn"
                    ? "Sign up with Google"
                    : "Sign up with Google"}
                </span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-slate-200/80 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 shrink-0">
              {lang === "bn" ? "অথবা ইমেইল দিয়ে" : "or with email"}
            </span>
            <div className="border-t border-slate-200/80 w-full" />
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
                    onClick={() => {
                      setForgotPasswordModal(true);
                      setForgotEmail(email);
                    }}
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
                ? "আপনার রেজিস্টার্ড ইমেইল অ্যাড্রেস লিখুন। আমরা রিকভারি লিংক ও নির্দেশাবলী পাঠিয়ে দেব।"
                : "Enter your registered email address to receive password reset instructions."}
            </p>

            {forgotSuccess ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  {lang === "bn"
                    ? "পাসওয়ার্ড রিসেট লিংক সফলভাবে আপনার ইমেইলে পাঠানো হয়েছে!"
                    : "Password reset link has been sent to your email address successfully!"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {lang === "bn" ? "ঠিক আছে" : "Done"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
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
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading
                      ? lang === "bn"
                        ? "পাঠানো হচ্ছে..."
                        : "Sending..."
                      : lang === "bn"
                      ? "লিংক পাঠান"
                      : "Send Link"}
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
