import React from "react";
import { Play, Square, RotateCw, Download, Terminal, Globe, Cpu } from "lucide-react";
import { WorkspaceStatus } from "../types";

interface HeaderProps {
  status: WorkspaceStatus | null;
  lang: "bn" | "en";
  setLang: (lang: "bn" | "en") => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onInstall: () => void;
  isActionLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  lang,
  setLang,
  onStart,
  onStop,
  onRestart,
  onInstall,
  isActionLoading,
}) => {
  const isRunning = status?.status === "running";
  const isInstalling = status?.status === "installing";

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <header id="app-header" className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Logo & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-sm">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {lang === "bn" ? "টেলিগ্রাম বট রানার" : "Telegram Bot Runner"}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Python 3.10
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning
                      ? "bg-emerald-500 animate-pulse"
                      : isInstalling
                      ? "bg-amber-500 animate-pulse"
                      : status?.status === "error"
                      ? "bg-rose-500"
                      : "bg-slate-400"
                  }`}
                />
                <span className="font-semibold text-slate-700 capitalize">
                  {isInstalling
                    ? lang === "bn"
                      ? "প্যাকেজ ইনস্টল হচ্ছে..."
                      : "Installing Dependencies..."
                    : isRunning
                    ? lang === "bn"
                      ? "বট চলছে (Active)"
                      : "Running Active"
                    : status?.status === "error"
                    ? lang === "bn"
                      ? "ত্রুটি / বন্ধ"
                      : "Error / Stopped"
                    : lang === "bn"
                    ? "বট বন্ধ আছে"
                    : "Stopped"}
                </span>
              </span>

              {isRunning && status?.pid && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  • PID: <span className="font-mono text-slate-600">{status.pid}</span>
                </span>
              )}
              {isRunning && status?.uptimeSeconds !== undefined && (
                <span className="text-xs text-slate-400">
                  • {lang === "bn" ? "চলছে" : "Uptime"}:{" "}
                  <span className="font-mono font-medium text-slate-700">
                    {formatUptime(status.uptimeSeconds)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Language */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Language toggle */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            title="Language / ভাষা পরিবর্তন করুন"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === "bn" ? "English" : "বাংলা"}</span>
          </button>

          {/* Install Requirements Button */}
          <button
            id="install-reqs-btn"
            onClick={onInstall}
            disabled={isActionLoading || isInstalling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title={lang === "bn" ? "requirements.txt এর প্যাকেজ ইনস্টল করুন" : "Install packages from requirements.txt"}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === "bn" ? "প্যাকেজ ইনস্টল (pip)" : "Install Pip Reqs"}</span>
          </button>

          {/* Start or Stop Bot */}
          {isRunning ? (
            <>
              <button
                id="restart-bot-btn"
                onClick={onRestart}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{lang === "bn" ? "রিস্টার্ট" : "Restart"}</span>
              </button>
              <button
                id="stop-bot-btn"
                onClick={onStop}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>{lang === "bn" ? "বট বন্ধ করুন" : "Stop Bot"}</span>
              </button>
            </>
          ) : (
            <button
              id="start-bot-btn"
              onClick={onStart}
              disabled={isActionLoading || isInstalling}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{lang === "bn" ? "বট চালু করুন (Run)" : "Start Bot"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
