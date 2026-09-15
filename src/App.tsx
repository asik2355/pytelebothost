import React, { useState, useEffect, useCallback } from "react";
import { TopBanner } from "./components/TopBanner";
import { BottomNav, NavRoute } from "./components/BottomNav";
import { HomePageView } from "./components/HomePageView";
import { ServicesPageView } from "./components/ServicesPageView";
import { BillingPageView } from "./components/BillingPageView";
import { BotStorePageView } from "./components/BotStorePageView";
import { MyServersPageView } from "./components/MyServersPageView";
import { ReferralPageView } from "./components/ReferralPageView";
import { ServerDetailView } from "./components/ServerDetailView";
import { ServerControlPanelView } from "./components/ServerControlPanelView";
import { AuthPageView } from "./components/AuthPageView";
import { WorkspaceStatus, BotLog, TelegramBotProfile, AppNotification, ActiveServer, AuthUser } from "./types";
import { apiFetch } from "./lib/api";
import {
  subscribeToFirebaseAuthState,
  logoutFirebaseAuth,
  subscribeToUserServers,
  syncServerToCloud,
  deleteServerFromCloud,
} from "./lib/firebase";

export default function App() {
  const [lang, setLang] = useState<"bn" | "en">("en");
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [token, setToken] = useState<string>("");
  const [botProfile, setBotProfile] = useState<TelegramBotProfile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0.00);
  const [servers, setServers] = useState<ActiveServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [isViewingControlPanel, setIsViewingControlPanel] = useState<boolean>(false);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem("hostbot_auth_user");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null; // Guest / Unauthenticated by default
  });

  // Persistent user notifications for plan changes, money top-ups, system events
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("hostbot_notifications") || localStorage.getItem("zerobot_notifications");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: "notif-init-1",
        title: "Welcome to bot-host.xyz",
        titleBn: "bot-host.xyz এ স্বাগতম",
        desc: "Python 3.10 cloud bot hosting sandbox is active.",
        descBn: "আপনার ক্লাউড বট হোস্টিং স্যান্ডবক্স প্রস্তুত আছে।",
        timestamp: new Date().toISOString(),
        type: "system",
        read: false,
        link: "/home",
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("hostbot_notifications", JSON.stringify(notifications));
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

  // Router state: HOME, SERVICES, BILLING, BOT STORE, MY SERVERS, REFERRAL, LOGIN, REGISTRATION
  const [currentRoute, setCurrentRoute] = useState<NavRoute>(() => {
    const path = window.location.pathname;
    if (path === "/services" || path === "/service") return "/services";
    if (path === "/billing") return "/billing";
    if (path === "/bot-store") return "/bot-store";
    if (path === "/my-servers") return "/my-servers";
    if (path === "/referral" || path === "/referrals" || path === "/affiliate") return "/referral";
    if (path === "/login") return "/login";
    if (path === "/registration" || path === "/register") return "/registration";
    return "/home";
  });

  // Keep browser history and URL in sync with bottom nav
  const navigateTo = useCallback((route: string) => {
    let normalized: NavRoute = "/home";
    if (route === "/services" || route === "/service") normalized = "/services";
    else if (route === "/billing") normalized = "/billing";
    else if (route === "/bot-store") normalized = "/bot-store";
    else if (route === "/my-servers") normalized = "/my-servers";
    else if (route === "/referral" || route === "/referrals" || route === "/affiliate") normalized = "/referral";
    else if (route === "/login") normalized = "/login";
    else if (route === "/registration" || route === "/register") normalized = "/registration";
    else normalized = "/home";

    setSelectedServerId(null);
    setIsViewingControlPanel(false);
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
      setSelectedServerId(null);
      setIsViewingControlPanel(false);
      const path = window.location.pathname;
      if (path === "/services" || path === "/service") setCurrentRoute("/services");
      else if (path === "/billing") setCurrentRoute("/billing");
      else if (path === "/bot-store") setCurrentRoute("/bot-store");
      else if (path === "/my-servers") setCurrentRoute("/my-servers");
      else if (path === "/referral" || path === "/referrals" || path === "/affiliate") setCurrentRoute("/referral");
      else if (path === "/login") setCurrentRoute("/login");
      else if (path === "/registration" || path === "/register") setCurrentRoute("/registration");
      else setCurrentRoute("/home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Subscribe to Firebase Authentication state (persists across page refresh)
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuthState((fbUser) => {
      if (fbUser) {
        setCurrentUser((prev) => ({
          id: fbUser.id,
          name: fbUser.name,
          email: fbUser.email,
          photoURL: fbUser.photoURL || prev?.photoURL,
          avatarUrl: fbUser.avatarUrl || prev?.avatarUrl,
          telegramUsername: fbUser.telegramUsername || prev?.telegramUsername,
          role: fbUser.role || prev?.role || "user",
          balance: typeof fbUser.balance === "number" ? fbUser.balance : (prev?.balance ?? 0),
          walletBalance: typeof fbUser.balance === "number" ? fbUser.balance : (prev?.balance ?? 0),
          createdAt: fbUser.createdAt || prev?.createdAt || new Date().toISOString(),
          lastLoginAt: fbUser.lastLoginAt || new Date().toISOString(),
        }));

        if (typeof fbUser.balance === "number") {
          setWalletBalance(fbUser.balance);
        }

        try {
          localStorage.setItem("hostbot_auth_user", JSON.stringify(fbUser));
        } catch {
          // ignore
        }
      }
    });

    // Also check VPS server token if present
    const token = localStorage.getItem("vps_auth_token");
    if (token) {
      apiFetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.user) {
            setCurrentUser((prev) => ({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              telegramUsername: data.user.telegramUsername,
              role: data.user.role || "user",
              createdAt: data.user.createdAt || (prev?.createdAt || new Date().toISOString()),
            }));
          }
        })
        .catch(() => {
          // network or server startup notice
        });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    if (typeof user.balance === "number") {
      setWalletBalance(user.balance);
    }
    try {
      localStorage.setItem("hostbot_auth_user", JSON.stringify(user));
    } catch {
      // ignore
    }
    handleAddNotification({
      id: "auth_" + Date.now(),
      title: "Logged In Successfully",
      titleBn: "লগইন সফল হয়েছে",
      desc: `Welcome back, ${user.name}!`,
      descBn: `স্বাগতম ${user.name}! আপনার ড্যাশবোর্ড প্রস্তুত।`,
      timestamp: new Date().toISOString(),
      type: "system",
      read: false,
      link: "/home",
    });
  }, [handleAddNotification]);

  const handleSignOut = useCallback(async () => {
    try {
      await logoutFirebaseAuth();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem("hostbot_auth_user");
      localStorage.removeItem("vps_auth_token");
    } catch {
      // ignore
    }
    handleAddNotification({
      id: "signout_" + Date.now(),
      title: "Signed Out",
      titleBn: "সাইন আউট সম্পন্ন",
      desc: "You have been signed out from your account.",
      descBn: "আপনি সফলভাবে সাইন আউট হয়েছেন।",
      timestamp: new Date().toISOString(),
      type: "system",
      read: false,
    });
    navigateTo("/login");
  }, [handleAddNotification, navigateTo]);

  // Fetch Workspace Info & Token
  const fetchWallet = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem("vps_auth_token") || "";
      const res = await apiFetch(`/api/billing/wallet?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === "number") {
          setWalletBalance(data.balance);
        }
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const fetchServers = useCallback(async () => {
    if (!currentUser) {
      setServers([]);
      return;
    }
    try {
      const token = localStorage.getItem("vps_auth_token") || "";
      const res = await apiFetch(`/api/servers?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.servers)) {
          setServers(data.servers);
        }
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Subscribe to User Servers from Cloud Database (syncs seamlessly across all phones & devices)
  useEffect(() => {
    if (!currentUser?.id) {
      setServers([]);
      return;
    }

    const unsubCloudServers = subscribeToUserServers(currentUser.id, (cloudServers) => {
      if (cloudServers && cloudServers.length > 0) {
        setServers((prev) => {
          // Merge cloud servers with any local servers
          const merged = [...cloudServers];
          for (const s of prev) {
            if (!merged.some((m) => m.id === s.id)) {
              merged.push(s);
            }
          }
          return merged;
        });
      }
    });

    return () => {
      unsubCloudServers();
    };
  }, [currentUser?.id]);

  const handleServerCreated = useCallback(
    (newServer: ActiveServer) => {
      setServers((prev) => {
        const exists = prev.some((s) => s.id === newServer.id);
        if (exists) return prev.map((s) => (s.id === newServer.id ? newServer : s));
        return [...prev, newServer];
      });

      // Synchronize to cloud database so all other devices immediately show this server
      if (currentUser?.id) {
        syncServerToCloud(newServer, currentUser.id);
      }
    },
    [currentUser?.id]
  );

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await apiFetch("/api/workspace");
      if (res.ok) {
        const data: WorkspaceStatus = await res.json();
        setStatus(data);
      }
      if (currentUser) {
        fetchWallet();
      } else {
        setWalletBalance(0);
      }
    } catch {
      // ignore
    }
  }, [fetchWallet, currentUser]);

  // Fetch Current Token from .env
  const fetchCurrentToken = useCallback(async () => {
    try {
      const res = await apiFetch("/api/workspace/file?name=.env");
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
      const res = await apiFetch("/api/bot/test-token", {
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
      const resEnv = await apiFetch("/api/workspace/file?name=.env");
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

      await apiFetch("/api/workspace/file", {
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
    if (currentUser) {
      fetchServers();
      fetchWallet();
    } else {
      setServers([]);
      setWalletBalance(0);
    }
    const interval = setInterval(() => {
      fetchWorkspace();
      if (currentUser) {
        fetchServers();
        fetchWallet();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchWorkspace, fetchCurrentToken, fetchServers, fetchWallet, currentUser]);

  // Actions
  const handleStartBot = async () => {
    if (!currentUser) {
      alert(
        lang === "bn"
          ? "বট রান করতে অনুগ্রহ করে আগে সাইন ইন বা অ্যাকাউন্ট তৈরি করুন।"
          : "Please sign in or create an account to start your Telegram bot."
      );
      navigateTo("/login");
      return;
    }

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
      const res = await apiFetch("/api/bot/start", {
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
    if (!currentUser) {
      alert(
        lang === "bn"
          ? "বট কন্ট্রোল করতে অনুগ্রহ করে আগে লগইন করুন।"
          : "Please sign in to manage bots."
      );
      navigateTo("/login");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await apiFetch("/api/bot/stop", { method: "POST" });
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
    if (!currentUser) {
      alert(
        lang === "bn"
          ? "বট রিস্টার্ট করতে অনুগ্রহ করে আগে লগইন করুন।"
          : "Please sign in to restart bots."
      );
      navigateTo("/login");
      return;
    }

    setIsActionLoading(true);
    try {
      await apiFetch("/api/bot/restart", { method: "POST" });
      fetchWorkspace();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleInstallReqs = async () => {
    setIsActionLoading(true);
    try {
      await apiFetch("/api/bot/install", { method: "POST" });
      fetchWorkspace();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await apiFetch("/api/bot/logs/clear", { method: "POST" });
      setLogs([]);
    } catch {
      // ignore
    }
  };

  const handleSelectEntryFile = async (filename: string) => {
    try {
      await apiFetch("/api/bot/entry", {
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
      await apiFetch("/api/bot/template", {
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

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  const handleSelectServerForManage = (server: ActiveServer) => {
    setSelectedServerId(server.id);
    setIsViewingControlPanel(false);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // ignore
    }
  };

  const handleServerAction = async (serverId: string, action: "start" | "stop" | "restart") => {
    setIsActionLoading(true);
    try {
      const res = await apiFetch("/api/servers/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, action }),
      });
      if (res.ok) {
        await fetchServers();
        const s = servers.find((item) => item.id === serverId);
        handleAddNotification({
          id: `srv-${Date.now()}`,
          title: `Server ${action === "start" ? "Started" : action === "stop" ? "Stopped" : "Restarted"}`,
          titleBn: `সার্ভার ${action === "start" ? "চালু" : action === "stop" ? "বন্ধ" : "রিস্টার্ট"} করা হয়েছে`,
          desc: `Server "${s ? s.name : serverId}" is now ${action === "stop" ? "STOPPED" : "RUNNING"}.`,
          descBn: `সার্ভার "${s ? s.name : serverId}" এখন ${action === "stop" ? "বন্ধ" : "চলমান"} আছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteServer = async (serverId: string, serverName: string) => {
    const confirmText =
      lang === "bn"
        ? `আপনি কি নিশ্চিতভাবে "${serverName}" সার্ভারটি ডিলিট করতে চান?`
        : `Are you sure you want to permanently delete server "${serverName}"?`;
    if (!window.confirm(confirmText)) return;

    setIsActionLoading(true);
    try {
      const res = await apiFetch(`/api/servers/${serverId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchServers();
        setSelectedServerId(null);
        setIsViewingControlPanel(false);
        handleAddNotification({
          id: `srv-del-${Date.now()}`,
          title: "Server Terminated",
          titleBn: "সার্ভার ডিলিট করা হয়েছে",
          desc: `Server "${serverName}" has been successfully deleted.`,
          descBn: `সার্ভার "${serverName}" সফলভাবে ডিলিট করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Permanent Top Banner (bot-host.xyz) */}
      <TopBanner
        lang={lang}
        setLang={setLang}
        status={status}
        walletBalance={walletBalance}
        currentRoute={currentRoute}
        currentUser={currentUser}
        onSignOut={handleSignOut}
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
        {selectedServer ? (
          isViewingControlPanel ? (
            <ServerControlPanelView
              server={selectedServer}
              allServers={servers}
              onSelectServer={(srv) => setSelectedServerId(srv.id)}
              lang={lang}
              onBackToDetails={() => setIsViewingControlPanel(false)}
              onBackToServers={() => {
                setSelectedServerId(null);
                setIsViewingControlPanel(false);
                navigateTo("/my-servers");
              }}
              onServerAction={handleServerAction}
              onDeleteServer={handleDeleteServer}
              onAddNotification={handleAddNotification}
              onServerUpdated={fetchServers}
            />
          ) : (
            <ServerDetailView
              server={selectedServer}
              lang={lang}
              onBack={() => {
                setSelectedServerId(null);
                setIsViewingControlPanel(false);
              }}
              onGoToPanel={() => setIsViewingControlPanel(true)}
              onServerAction={handleServerAction}
              onDeleteServer={handleDeleteServer}
              onAddNotification={handleAddNotification}
            />
          )
        ) : (
          <>
            {/* Route 1: HOME (Dashboard & Active Servers matching user design) */}
            {currentRoute === "/home" && (
              <HomePageView
                status={status}
                botProfile={botProfile}
                lang={lang}
                currentUser={currentUser}
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
                onSelectServerForManage={handleSelectServerForManage}
              />
            )}

            {/* Route 2: SERVICES */}
            {currentRoute === "/services" && (
              <ServicesPageView
                lang={lang}
                status={status}
                currentUser={currentUser}
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
                currentUser={currentUser}
                onNavigate={navigateTo}
                onWalletUpdated={(balance) => setWalletBalance(balance)}
                onAddNotification={handleAddNotification}
              />
            )}

            {/* Route 4: BOT STORE */}
            {currentRoute === "/bot-store" && (
              <BotStorePageView
                lang={lang}
                currentUser={currentUser}
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
                currentUser={currentUser}
                onNavigate={navigateTo}
                onRefreshServers={fetchServers}
                onAddNotification={handleAddNotification}
                walletBalance={walletBalance}
                onWalletUpdated={(bal) => setWalletBalance(bal)}
                onServerCreated={handleServerCreated}
                onSelectServerForManage={handleSelectServerForManage}
              />
            )}

            {/* Route 6: REFERRAL (/referral) */}
            {currentRoute === "/referral" && (
              <ReferralPageView
                lang={lang}
                currentUser={currentUser}
                walletBalance={walletBalance}
                onNavigate={navigateTo}
                onAddNotification={handleAddNotification}
              />
            )}

            {/* Route 7: LOGIN (/login) */}
            {currentRoute === "/login" && (
              <AuthPageView
                initialMode="login"
                lang={lang}
                onAuthSuccess={handleAuthSuccess}
                onNavigate={navigateTo}
              />
            )}

            {/* Route 8: REGISTRATION (/registration) */}
            {currentRoute === "/registration" && (
              <AuthPageView
                initialMode="registration"
                lang={lang}
                onAuthSuccess={handleAuthSuccess}
                onNavigate={navigateTo}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Navigation Bar in English (HOME, SERVICE, BILLING, BOT STORE) - Hidden on Login & Registration */}
      {currentRoute !== "/login" && currentRoute !== "/registration" && (
        <BottomNav
          currentRoute={currentRoute}
          onRouteChange={navigateTo}
          isBotRunning={isRunning}
        />
      )}

      {/* Footer */}
      <footer className={`border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-500 ${currentRoute !== "/login" && currentRoute !== "/registration" ? "mb-16" : "mb-0"}`}>
        <p>
          {lang === "bn"
            ? "Telegram Bot Runner • Python ৩.১০ ক্লাউড রানার • টেলিগ্রাম বট হোস্ট এবং রান করুন"
            : "Telegram Bot Runner • Python 3.10 Cloud Sandbox Runner for Telegram Bots"}
        </p>
      </footer>
    </div>
  );
}
