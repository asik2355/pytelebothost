import React, { useState, useEffect, useCallback } from "react";
import { TopBanner } from "./components/TopBanner";
import { Header } from "./components/Header";
import { TokenCard } from "./components/TokenCard";
import { FileUploader } from "./components/FileUploader";
import { FileEditor } from "./components/FileEditor";
import { TerminalLogs } from "./components/TerminalLogs";
import { TemplateSelector } from "./components/TemplateSelector";
import { EnvManager } from "./components/EnvManager";
import { BottomNav, NavRoute } from "./components/BottomNav";
import { HomePageView } from "./components/HomePageView";
import { ServicesPageView } from "./components/ServicesPageView";
import { BillingPageView } from "./components/BillingPageView";
import { BotStorePageView } from "./components/BotStorePageView";
import { WorkspaceStatus, BotLog, TelegramBotProfile, AppNotification } from "./types";
import { AlertTriangle, Play, HelpCircle, BookOpen, Bot } from "lucide-react";

export default function App() {
  const [lang, setLang] = useState<"bn" | "en">("en");
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [token, setToken] = useState<string>("");
  const [botProfile, setBotProfile] = useState<TelegramBotProfile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "env" | "templates">("workspace");
  const [walletBalance, setWalletBalance] = useState<number>(117.50);

  // Persistent user notifications for plan changes, money top-ups, system events
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("zerobot_notifications");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: "notif-init-1",
        title: "Welcome to Zero-Bot",
        titleBn: "Zero-Bot এ স্বাগতম",
        desc: "Python 3.10 cloud sandbox is active with ৳117.50 starter balance.",
        descBn: "আপনার ক্লাউড স্যান্ডবক্স প্রস্তুত এবং ওয়ালেটে ৳১১৭.৫০ প্রারম্ভিক ব্যালেন্স যুক্ত আছে।",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "system",
        read: false,
        link: "/home",
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("zerobot_notifications", JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const handleAddNotification = useCallback((newNotif: AppNotification) => {
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Router state: HOME, SERVICES, BILLING, BOT STORE
  const [currentRoute, setCurrentRoute] = useState<NavRoute>(() => {
    const path = window.location.pathname;
    if (path === "/services" || path === "/service") return "/services";
    if (path === "/billing") return "/billing";
    if (path === "/bot-store") return "/bot-store";
    return "/home";
  });

  // Keep browser history and URL in sync with bottom nav
  const navigateTo = useCallback((route: string) => {
    let normalized: NavRoute = "/home";
    if (route === "/services" || route === "/service") normalized = "/services";
    else if (route === "/billing") normalized = "/billing";
    else if (route === "/bot-store") normalized = "/bot-store";
    else normalized = "/home";

    setCurrentRoute(normalized);
    try {
      if (window.location.pathname !== normalized) {
        window.history.pushState({}, "", normalized);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to browser popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/services" || path === "/service") setCurrentRoute("/services");
      else if (path === "/billing") setCurrentRoute("/billing");
      else if (path === "/bot-store") setCurrentRoute("/bot-store");
      else setCurrentRoute("/home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch Workspace Info & Token
  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/wallet");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === "number") {
          setWalletBalance(data.balance);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data: WorkspaceStatus = await res.json();
        setStatus(data);
      }
      fetchWallet();
    } catch {
      // ignore
    }
  }, [fetchWallet]);

  // Fetch Current Token from .env
  const fetchCurrentToken = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/file?name=.env");
      if (res.ok) {
        const data = await res.json();
        const content = data.content || "";
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("BOT_TOKEN=")) {
            const val = trimmed.slice("BOT_TOKEN=".length).trim().replace(/^["']|["']$/g, "");
            setToken(val);
            // Verify if non-empty
            if (val.length > 10) {
              verifyToken(val);
            }
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Verify token via Telegram API
  const verifyToken = async (testToken?: string): Promise<TelegramBotProfile | null> => {
    const t = testToken || token;
    if (!t) return null;
    try {
      const res = await fetch("/api/bot/test-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      if (data.valid && data.bot) {
        setBotProfile(data.bot);
        return data.bot;
      } else {
        setBotProfile(null);
        return null;
      }
    } catch {
      setBotProfile(null);
      return null;
    }
  };

  // Save token into .env
  const saveToken = async (newToken: string): Promise<boolean> => {
    try {
      // Get current env
      const resEnv = await fetch("/api/workspace/file?name=.env");
      let currentLines: string[] = [];
      if (resEnv.ok) {
        const data = await resEnv.json();
        currentLines = (data.content || "").split("\n");
      }
      let replaced = false;
      const updatedLines = currentLines.map((line) => {
        if (line.trim().startsWith("BOT_TOKEN=")) {
          replaced = true;
          return `BOT_TOKEN=${newToken}`;
        }
        return line;
      });
      if (!replaced) {
        updatedLines.push(`BOT_TOKEN=${newToken}`);
      }

      await fetch("/api/workspace/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ".env", content: updatedLines.join("\n") }),
      });

      setToken(newToken);
      fetchWorkspace();
      return true;
    } catch {
      return false;
    }
  };

  // Setup Server-Sent Events (SSE) for Real-Time Logs
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/bot/logs/stream");

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "initial" && Array.isArray(parsed.logs)) {
            setLogs(parsed.logs);
          } else if (parsed.id) {
            setLogs((prev) => {
              // Avoid duplicates
              if (prev.some((p) => p.id === parsed.id)) return prev;
              return [...prev, parsed];
            });
          }
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE disconnects
      };
    } catch {
      // ignore
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // Periodic workspace status polling
  useEffect(() => {
    fetchWorkspace();
    fetchCurrentToken();
    const interval = setInterval(fetchWorkspace, 2500);
    return () => clearInterval(interval);
  }, [fetchWorkspace, fetchCurrentToken]);

  // Actions
  const handleStartBot = async () => {
    if (!token && !status?.hasToken) {
      alert(
        lang === "bn"
          ? "অনুগ্রহ করে প্রথমে আপনার Telegram Bot Token দিন!"
          : "Please configure your Telegram Bot Token first!"
      );
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/bot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryFile: status?.currentEntryFile || "bot.py" }),
      });
      fetchWorkspace();
      if (res.ok) {
        handleAddNotification({
          id: `notif-bot-start-${Date.now()}`,
          title: "Bot Process Started",
          titleBn: "টেলিগ্রাম বট সফলভাবে চালু হয়েছে",
          desc: "Python process is running and actively listening for messages.",
          descBn: "পাইথন বট প্রসেসটি সফলভাবে রান হচ্ছে এবং মেসেজের অপেক্ষা করছে।",
          timestamp: new Date().toISOString(),
          type: "bot",
          read: false,
          link: "/home",
        });
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/bot/stop", { method: "POST" });
      fetchWorkspace();
      if (res.ok) {
        handleAddNotification({
          id: `notif-bot-stop-${Date.now()}`,
          title: "Bot Stopped",
          titleBn: "টেলিগ্রাম বট বন্ধ করা হয়েছে",
          desc: "Python bot process has been stopped.",
          descBn: "বট প্রসেসটি নিরাপদে বন্ধ করা হয়েছে।",
          timestamp: new Date().toISOString(),
          type: "bot",
          read: false,
          link: "/home",
        });
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestartBot = async () => {
    setIsActionLoading(true);
    try {
      await fetch("/api/bot/restart", { method: "POST" });
      fetchWorkspace();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleInstallReqs = async () => {
    setIsActionLoading(true);
    try {
      await fetch("/api/bot/install", { method: "POST" });
      fetchWorkspace();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch("/api/bot/logs/clear", { method: "POST" });
      setLogs([]);
    } catch {
      // ignore
    }
  };

  const handleSelectEntryFile = async (filename: string) => {
    try {
      await fetch("/api/bot/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryFile: filename }),
      });
      fetchWorkspace();
    } catch {
      // ignore
    }
  };

  const handleLoadTemplate = async (templateId: string) => {
    try {
      await fetch("/api/bot/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      fetchWorkspace();
      // Re-verify token if already set
      if (token) {
        verifyToken(token);
      }
    } catch {
      // ignore
    }
  };

  const isRunning = status?.status === "running";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Permanent Top Banner (Zero-Bot) */}
      <TopBanner
        lang={lang}
        setLang={setLang}
        status={status}
        walletBalance={walletBalance}
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onStartBot={handleStartBot}
        onStopBot={handleStopBot}
        onRestartBot={handleRestartBot}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 pb-24">
        {/* Route 1: HOME (Dashboard & Active Servers matching user design) */}
        {currentRoute === "/home" && (
          <div className="space-y-6">
            <HomePageView
              status={status}
              botProfile={botProfile}
              lang={lang}
              onNavigate={navigateTo}
              onStartBot={handleStartBot}
              onStopBot={handleStopBot}
              onRestartBot={handleRestartBot}
              onInstallReqs={handleInstallReqs}
              isActionLoading={isActionLoading}
              walletBalance={walletBalance}
              onWalletUpdated={(bal) => setWalletBalance(bal)}
              onAddNotification={handleAddNotification}
            />

            {/* Direct Bot Runner Workspace */}
            <div id="bot-workspace-runner" className="space-y-5 pt-4 border-t border-slate-200/80 mt-6">
              {/* Token Alert if not configured */}
              {!token && !status?.hasToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900">
                      {lang === "bn"
                        ? "টেলিগ্রাম বট টোকেন প্রয়োজন"
                        : "Telegram Bot Token Required"}
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      {lang === "bn"
                        ? "আপনার বট টেলিগ্রাম নেটওয়ার্কে সংযুক্ত করার জন্য BotFather থেকে প্রাপ্ত BOT_TOKEN নিচে প্রবেশ করিয়ে সেভ করুন।"
                        : "To connect your bot to Telegram, enter and save your BOT_TOKEN below."}
                    </p>
                  </div>
                </div>
              )}

              {/* Telegram Bot Token Card */}
              <TokenCard
                token={token}
                lang={lang}
                onSaveToken={saveToken}
                onVerifyToken={verifyToken}
                botProfile={botProfile}
              />

              {/* Action / Mode Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("workspace")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "workspace"
                        ? "bg-sky-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {lang === "bn" ? "ফাইল ও লাইভ কনসোল" : "Files & Live Console"}
                  </button>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "templates"
                        ? "bg-sky-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {lang === "bn" ? "রেডিমেড বট টেমপ্লেট" : "Ready Templates"}
                  </button>
                  <button
                    onClick={() => setActiveTab("env")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "env"
                        ? "bg-sky-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {lang === "bn" ? "এনভায়রনমেন্ট ভ্যারিয়েবল (.env)" : "Environment (.env)"}
                  </button>
                </div>

                {/* Quick running status pill */}
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <span className="text-slate-500">{lang === "bn" ? "প্রধান এন্ট্রি:" : "Entry file:"}</span>
                  <span className="font-mono font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {status?.currentEntryFile || "bot.py"}
                  </span>
                </div>
              </div>

              {/* Tab 1: Workspace Files & Live Terminal */}
              {activeTab === "workspace" && (
                <div className="space-y-5">
                  {/* File Uploader */}
                  <FileUploader lang={lang} onFilesUploaded={fetchWorkspace} />

                  {/* Editor & Terminal split layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* File Manager & Code Editor */}
                    <FileEditor
                      files={status?.files || []}
                      currentEntryFile={status?.currentEntryFile || "bot.py"}
                      lang={lang}
                      onSelectEntryFile={handleSelectEntryFile}
                      onFileSaved={fetchWorkspace}
                    />

                    {/* Live Terminal Console */}
                    <TerminalLogs
                      logs={logs}
                      lang={lang}
                      onClearLogs={handleClearLogs}
                      status={status?.status || "stopped"}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Templates */}
              {activeTab === "templates" && (
                <div className="space-y-4">
                  <TemplateSelector
                    lang={lang}
                    onLoadTemplate={async (id) => {
                      await handleLoadTemplate(id);
                      setActiveTab("workspace");
                    }}
                  />
                </div>
              )}

              {/* Tab 3: Environment Variables */}
              {activeTab === "env" && (
                <div className="space-y-4">
                  <EnvManager lang={lang} onEnvUpdated={fetchWorkspace} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Route 2: SERVICES */}
        {currentRoute === "/services" && (
          <ServicesPageView
            lang={lang}
            status={status}
            onNavigate={navigateTo}
            onAddNotification={handleAddNotification}
          />
        )}

        {/* Route 3: BILLING */}
        {currentRoute === "/billing" && (
          <BillingPageView
            lang={lang}
            onNavigate={navigateTo}
            onWalletUpdated={(balance) => setWalletBalance(balance)}
            onAddNotification={handleAddNotification}
          />
        )}

        {/* Route 4: BOT STORE */}
        {currentRoute === "/bot-store" && (
          <BotStorePageView
            lang={lang}
            onLoadTemplate={handleLoadTemplate}
            onNavigate={navigateTo}
            isLoading={isActionLoading}
          />
        )}

        {/* Bottom Helper Guide / FAQ in Bengali & English (Only on Home Workspace) */}
        {currentRoute === "/home" && (
          <section id="usage-guide" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                {lang === "bn" ? "ব্যবহার নির্দেশিকা (How to use)" : "User Guide & Troubleshooting"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                  1. {lang === "bn" ? "ফাইল আপলোড" : "Upload Files"}
                </span>
                <p>
                  {lang === "bn"
                    ? "আপনার বটের python কোড (যেমন bot.py) এবং লাইব্রেরির তালিকা (requirements.txt) ড্র্যাগ করে আপলোড করুন।"
                    : "Drag and drop your bot python code (bot.py) and requirements.txt to the workspace."}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                  2. {lang === "bn" ? "প্যাকেজ ইনস্টল ও টোকেন" : "Install Pip & Set Token"}
                </span>
                <p>
                  {lang === "bn"
                    ? "উপরে 'প্যাকেজ ইনস্টল (pip)' বাটনে ক্লিক করুন। তারপর BotFather থেকে পাওয়া টোকেনটি পেস্ট করে সেভ করুন।"
                    : "Click 'Install Pip Reqs' to install packages, then paste and verify your Telegram Bot Token."}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                  3. {lang === "bn" ? "বট চালু ও টেস্ট" : "Start & Test Bot"}
                </span>
                <p>
                  {lang === "bn"
                    ? "'বট চালু করুন (Run)' বাটনে ক্লিক করুন। লাইভ টার্মিনালে মেসেজ এবং লগ দেখতে পাবেন। Telegram এ গিয়ে বটের সাথে চ্যাট করুন!"
                    : "Click 'Start Bot' to launch the Python process. View live stdout/stderr logs in the console terminal."}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Persistent Bottom Navigation Bar in English (HOME, SERVICE, BILLING, BOT STORE) */}
      <BottomNav
        currentRoute={currentRoute}
        onRouteChange={navigateTo}
        isBotRunning={isRunning}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-500 mb-16">
        <p>
          {lang === "bn"
            ? "Telegram Bot Runner • Python ৩.১০ ক্লাউড রানার • টেলিগ্রাম বট হোস্ট এবং রান করুন"
            : "Telegram Bot Runner • Python 3.10 Cloud Sandbox Runner for Telegram Bots"}
        </p>
      </footer>
    </div>
  );
}
