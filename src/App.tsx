import React, { useState, useEffect, useCallback } from "react";
import { TopBanner } from "./components/TopBanner";
import { BottomNav, NavRoute } from "./components/BottomNav";
import { HomePageView } from "./components/HomePageView";
import { ServicesPageView } from "./components/ServicesPageView";
import { BillingPageView } from "./components/BillingPageView";
import { BotStorePageView } from "./components/BotStorePageView";
import { MyServersPageView } from "./components/MyServersPageView";
import { WorkspaceStatus, BotLog, TelegramBotProfile, AppNotification, ActiveServer } from "./types";

export default function App() {
  const [lang, setLang] = useState<"bn" | "en">("en");
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [token, setToken] = useState<string>("");
  const [botProfile, setBotProfile] = useState<TelegramBotProfile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(117.50);
  const [servers, setServers] = useState<ActiveServer[]>([]);

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

  // Router state: HOME, SERVICES, BILLING, BOT STORE, MY SERVERS
  const [currentRoute, setCurrentRoute] = useState<NavRoute>(() => {
    const path = window.location.pathname;
    if (path === "/services" || path === "/service") return "/services";
    if (path === "/billing") return "/billing";
    if (path === "/bot-store") return "/bot-store";
    if (path === "/my-servers") return "/my-servers";
    return "/home";
  });

  // Keep browser history and URL in sync with bottom nav
  const navigateTo = useCallback((route: string) => {
    let normalized: NavRoute = "/home";
    if (route === "/services" || route === "/service") normalized = "/services";
    else if (route === "/billing") normalized = "/billing";
    else if (route === "/bot-store") normalized = "/bot-store";
    else if (route === "/my-servers") normalized = "/my-servers";
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
      else if (path === "/my-servers") setCurrentRoute("/my-servers");
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

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch("/api/servers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.servers)) {
          setServers(data.servers);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleServerCreated = useCallback((newServer: ActiveServer) => {
    setServers((prev) => {
      const exists = prev.some((s) => s.id === newServer.id);
      if (exists) return prev.map((s) => (s.id === newServer.id ? newServer : s));
      return [...prev, newServer];
    });
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
    fetchServers();
    const interval = setInterval(() => {
      fetchWorkspace();
      fetchServers();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchWorkspace, fetchCurrentToken, fetchServers]);

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
            servers={servers}
            onServerCreated={handleServerCreated}
            onRefreshServers={fetchServers}
          />
        )}

        {/* Route 2: SERVICES */}
        {currentRoute === "/services" && (
          <ServicesPageView
            lang={lang}
            status={status}
            walletBalance={walletBalance}
            onNavigate={navigateTo}
            onWalletUpdated={(bal) => setWalletBalance(bal)}
            onServerCreated={handleServerCreated}
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

        {/* Route 5: MY SERVERS (matching user screenshot) */}
        {currentRoute === "/my-servers" && (
          <MyServersPageView
            servers={servers}
            lang={lang}
            onNavigate={navigateTo}
            onRefreshServers={fetchServers}
            onAddNotification={handleAddNotification}
            walletBalance={walletBalance}
            onWalletUpdated={(bal) => setWalletBalance(bal)}
            onServerCreated={handleServerCreated}
          />
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
