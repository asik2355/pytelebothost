import React, { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, HelpCircle, ExternalLink, Loader2, Save } from "lucide-react";
import { TelegramBotProfile } from "../types";

interface TokenCardProps {
  token: string;
  lang: "bn" | "en";
  onSaveToken: (newToken: string) => Promise<boolean>;
  onVerifyToken: (tokenToTest?: string) => Promise<TelegramBotProfile | null>;
  botProfile: TelegramBotProfile | null;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  lang,
  onSaveToken,
  onVerifyToken,
  botProfile,
}) => {
  const [tokenInput, setTokenInput] = useState(token);
  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Sync token prop when changed externally
  React.useEffect(() => {
    setTokenInput(token);
  }, [token]);

  const handleSaveAndVerify = async () => {
    if (!tokenInput.trim()) return;
    setIsSaving(true);
    setVerificationError(null);
    try {
      await onSaveToken(tokenInput.trim());
      setIsVerifying(true);
      const profile = await onVerifyToken(tokenInput.trim());
      if (!profile) {
        setVerificationError(
          lang === "bn"
            ? "টোকেনটি সঠিক নয়। অনুগ্রহ করে @BotFather থেকে নেওয়া টোকেনটি পুনরায় চেক করুন।"
            : "Invalid token. Please check the token provided by @BotFather."
        );
      }
    } catch (err: any) {
      setVerificationError(err.message || "Failed to verify token");
    } finally {
      setIsSaving(false);
      setIsVerifying(false);
    }
  };

  const handleQuickVerify = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const profile = await onVerifyToken(tokenInput.trim());
      if (!profile) {
        setVerificationError(
          lang === "bn"
            ? "টোকেনটি সঠিক নয়। অনুগ্রহ করে চেক করুন।"
            : "Invalid bot token"
        );
      }
    } catch (err: any) {
      setVerificationError(err.message || "Verification error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div id="telegram-token-card" className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === "bn" ? "টেলিগ্রাম বট টোকেন (BOT_TOKEN)" : "Telegram Bot Token (BOT_TOKEN)"}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "bn"
                ? "বট রান করার জন্য BotFather থেকে প্রাপ্ত টোকেন এখানে দিন"
                : "Enter your Telegram Bot Token from @BotFather to authenticate your bot"}
            </p>
          </div>
        </div>

        <button
          id="toggle-guide-btn"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium transition-colors self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{lang === "bn" ? "টোকেন কিভাবে পাবো?" : "How to get a token?"}</span>
        </button>
      </div>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            id="bot-token-input"
            type={showToken ? "text" : "password"}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            className="w-full font-mono text-xs sm:text-sm pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            title={showToken ? "Hide token" : "Show token"}
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="save-token-btn"
            onClick={handleSaveAndVerify}
            disabled={isSaving || isVerifying || !tokenInput.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSaving || isVerifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{lang === "bn" ? "সংরক্ষণ ও যাচাই" : "Save & Verify"}</span>
          </button>

          {token && (
            <button
              id="verify-token-btn"
              onClick={handleQuickVerify}
              disabled={isVerifying}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === "bn" ? "পুনরায় টেস্ট" : "Test")}
            </button>
          )}
        </div>
      </div>

      {/* Verification Status Banner */}
      {botProfile && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-900">
                {lang === "bn" ? "টোকেন সফলভাবে যাচাইকৃত:" : "Token Verified:"}{" "}
              </span>
              <span className="font-medium text-emerald-800">
                {botProfile.first_name} (@{botProfile.username})
              </span>
              <span className="text-emerald-700 ml-1.5 font-mono text-[11px]">
                [ID: {botProfile.id}]
              </span>
            </div>
          </div>
          <a
            id="open-telegram-bot-link"
            href={`https://t.me/${botProfile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-md shadow-2xs hover:bg-sky-50 transition-colors"
          >
            <span>{lang === "bn" ? "টেলিগ্রামে বট খুলুন" : "Open in Telegram"}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Error state */}
      {verificationError && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{verificationError}</span>
        </div>
      )}

      {/* Guide accordion */}
      {showGuide && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-700 space-y-2 bg-slate-50/70 p-3.5 rounded-lg">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <span>
              {lang === "bn"
                ? "💡 টেলিগ্রাম বট টোকেন পাওয়ার সহজ ধাপসমূহ:"
                : "💡 Step-by-step: How to get a Telegram Bot Token:"}
            </span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-slate-600">
            <li>
              {lang === "bn" ? (
                <>টেলিগ্রাম অ্যাপে গিয়ে সার্চ করুন <strong className="text-sky-700">@BotFather</strong> এবং স্টার্ট করুন।</>
              ) : (
                <>Open Telegram and search for <strong className="text-sky-700">@BotFather</strong> (verified bot).</>
              )}
            </li>
            <li>
              {lang === "bn" ? (
                <>মেসেজ পাঠান <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">/newbot</code></>
              ) : (
                <>Send the command <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">/newbot</code></>
              )}
            </li>
            <li>
              {lang === "bn" ? (
                <>আপনার বটের একটি নাম দিন (যেমন: <span className="italic">My Assistant Bot</span>)।</>
              ) : (
                <>Enter a name for your bot (e.g., <span className="italic">My Assistant Bot</span>).</>
              )}
            </li>
            <li>
              {lang === "bn" ? (
                <>একটি অনন্য ইউজারনেম দিন যার শেষে <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">bot</code> থাকবে (যেমন: <span className="italic">my_assistant_123_bot</span>)।</>
              ) : (
                <>Choose a unique username ending with <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">bot</code> (e.g. <span className="italic">my_assistant_123_bot</span>).</>
              )}
            </li>
            <li>
              {lang === "bn" ? (
                <>BotFather আপনাকে একটি HTTP API Token প্রদান করবে (যেমন: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">712345678:AAHjklm...</code>)। সেটি কপি করে উপরের বক্সে পেস্ট করুন।</>
              ) : (
                <>BotFather will send your HTTP API token. Copy and paste it in the box above.</>
              )}
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
