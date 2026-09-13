import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Terminal as TerminalIcon,
  FolderOpen,
  Wifi,
  Play,
  RotateCw,
  Square,
  Settings as SettingsIcon,
  Activity as ActivityIcon,
  Save,
  Trash2,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Upload,
  FileCode,
  FileText,
  Clock,
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { ActiveServer, AppNotification, BotLog, WorkspaceFile } from "../types";

export type ControlPanelTab =
  | "Console"
  | "Files"
  | "Network"
  | "Startup"
  | "Settings"
  | "Activity";

interface ServerControlPanelViewProps {
  server: ActiveServer;
  allServers?: ActiveServer[];
  onSelectServer?: (server: ActiveServer) => void;
  lang: "bn" | "en";
  onBackToDetails: () => void;
  onBackToServers: () => void;
  onServerAction: (serverId: string, action: "start" | "stop" | "restart") => Promise<void>;
  onDeleteServer?: (serverId: string, serverName: string) => Promise<void>;
  onAddNotification?: (notif: AppNotification) => void;
  onServerUpdated?: () => void;
}

export const ServerControlPanelView: React.FC<ServerControlPanelViewProps> = ({
  server,
  allServers,
  onSelectServer,
  lang,
  onBackToDetails,
  onBackToServers,
  onServerAction,
  onDeleteServer,
  onAddNotification,
  onServerUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ControlPanelTab>("Console");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Console State
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [isCopiedLogs, setIsCopiedLogs] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Files State
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [isNewFileModal, setIsNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Startup State
  const [startupCmd, setStartupCmd] = useState(server.startupCommand || (server.category === "golang" ? "go run main.go" : "python3 main.py"));
  const [isSavingStartup, setIsSavingStartup] = useState(false);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
    server.envVars || [
      { key: "SERVER_NAME", value: server.name },
      { key: "PORT", value: (server.port || 25565).toString() },
      { key: "PYTHONUNBUFFERED", value: "1" },
    ]
  );
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvVal, setNewEnvVal] = useState("");

  // Settings State
  const [serverNameInput, setServerNameInput] = useState(server.name);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isReinstalling, setIsReinstalling] = useState(false);

  // Activity Log State
  const [activities, setActivities] = useState<
    Array<{ id: string; action: string; user: string; ip: string; time: string; type: "start" | "stop" | "file" | "config" }>
  >([
    {
      id: "act-1",
      action: `Container mounted on node EU-01 for server ${server.name}`,
      user: "System Daemon",
      ip: "127.0.0.1",
      time: "Initial",
      type: "config",
    },
  ]);

  const isRunning = server.status === "RUNNING";
  const uuid = (server.region.split("•")[1] || server.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8)).trim();
  const assignedPort = server.port || 25565;
  const assignedIp = server.ip || "194.163.148.91";

  // Fetch per-server details & config
  const fetchServerDetails = async () => {
    try {
      const res = await fetch(`/api/servers/${server.id}/details`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          if (data.config.startupCommand) setStartupCmd(data.config.startupCommand);
          if (Array.isArray(data.config.envVars)) setEnvVars(data.config.envVars);
          if (Array.isArray(data.config.activities) && data.config.activities.length > 0) {
            setActivities(data.config.activities);
          }
        }
      }
    } catch {
      // fallback
    }
  };

  // Fetch per-server logs
  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/servers/${server.id}/logs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch {
      // ignore
    }
  };

  // Fetch per-server files
  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/servers/${server.id}/files`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files)) {
          setFiles(data.files);
          if (data.files.length > 0) {
            setSelectedFile((prev) => {
              const stillExists = data.files.some((f: any) => f.name === prev);
              const nextFile = stillExists && prev ? prev : data.files[0].name;
              loadFileContent(nextFile);
              return nextFile;
            });
          } else {
            setSelectedFile(null);
            setFileContent("");
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const loadFileContent = async (filename: string) => {
    try {
      const res = await fetch(`/api/servers/${server.id}/files/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content ?? "");
      }
    } catch {
      // ignore
    }
  };

  // Re-sync whenever server.id changes
  useEffect(() => {
    setServerNameInput(server.name);
    setStartupCmd(server.startupCommand || (server.category === "golang" ? "go run main.go" : "python3 main.py"));
    fetchServerDetails();
    fetchLogs();
    fetchFiles();
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [server.id]);

  useEffect(() => {
    if (activeTab === "Console") {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab]);

  const handleAction = async (action: "start" | "stop" | "restart") => {
    setIsActionLoading(true);
    try {
      await onServerAction(server.id, action);
      const newAct = {
        id: `act-${Date.now()}`,
        action: `Server [${server.name}] was ${action === "start" ? "started" : action === "stop" ? "stopped" : "restarted"}`,
        user: "Root Owner",
        ip: "103.144.17.202",
        time: "Just now",
        type: (action === "stop" ? "stop" : "start") as any,
      };
      setActivities((prev) => [newAct, ...prev]);
      await fetchLogs();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;
    setCommandInput("");

    // Optimistic log in UI
    const newLog: BotLog = {
      id: Date.now(),
      type: "stdout",
      message: `[container@hostbot ~]$ ${cmd}`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    };
    setLogs((prev) => [...prev, newLog]);

    try {
      const res = await fetch(`/api/servers/${server.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      if (res.ok) {
        await fetchLogs();
      }
    } catch {
      // ignore
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    try {
      const res = await fetch(`/api/servers/${server.id}/files/${encodeURIComponent(selectedFile)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent }),
      });
      if (res.ok) {
        onAddNotification?.({
          id: `file-save-${Date.now()}`,
          title: "File Saved",
          titleBn: "ফাইল সংরক্ষণ হয়েছে",
          desc: `File "${selectedFile}" updated in ${server.name}.`,
          descBn: `ফাইল "${selectedFile}" সার্ভার ${server.name}-এ সেভ হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            action: `File saved: ${selectedFile} in ${server.name}`,
            user: "Root Owner",
            ip: "103.144.17.202",
            time: "Just now",
            type: "file",
          },
          ...prev,
        ]);
      }
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(lang === "bn" ? `আপনি কি নিশ্চিত যে "${filename}" ফাইলটি ডিলিট করতে চান?` : `Are you sure you want to delete "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/servers/${server.id}/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchFiles();
        if (selectedFile === filename) {
          setSelectedFile(null);
          setFileContent("");
        }
        onAddNotification?.({
          id: `del-file-${Date.now()}`,
          title: "File Deleted",
          titleBn: "ফাইল ডিলিট হয়েছে",
          desc: `Deleted ${filename} from ${server.name}.`,
          descBn: `${server.name} থেকে ${filename} ডিলিট করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/servers/${server.id}/files/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchFiles();
        setSelectedFile(file.name);
        loadFileContent(file.name);
        onAddNotification?.({
          id: `upload-${Date.now()}`,
          title: "File Uploaded",
          titleBn: "ফাইল আপলোড হয়েছে",
          desc: `Uploaded ${file.name} to ${server.name}.`,
          descBn: `${file.name} সার্ভার ${server.name}-এ আপলোড হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();

    try {
      await fetch(`/api/servers/${server.id}/files/${encodeURIComponent(cleanName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `# New file for ${server.name}\n` }),
      });
      await fetchFiles();
      setSelectedFile(cleanName);
      setFileContent(`# New file for ${server.name}\n`);
      setIsNewFileModal(false);
      setNewFileName("");
    } catch {
      // ignore
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setIsCopiedLogs(true);
    setTimeout(() => setIsCopiedLogs(false), 2000);
  };

  const handleClearLogs = async () => {
    try {
      await fetch(`/api/servers/${server.id}/logs/clear`, { method: "POST" });
      setLogs([]);
    } catch {
      // ignore
    }
  };

  const handleSaveStartup = async () => {
    setIsSavingStartup(true);
    try {
      const res = await fetch(`/api/servers/${server.id}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupCommand: startupCmd,
          envVars,
        }),
      });
      if (res.ok) {
        onAddNotification?.({
          id: `startup-${Date.now()}`,
          title: "Startup Command Updated",
          titleBn: "স্টার্টআপ কমান্ড আপডেট হয়েছে",
          desc: `Startup configuration saved for ${server.name}.`,
          descBn: `${server.name} এর স্টার্টআপ কনফিগারেশন সংরক্ষণ করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
        onServerUpdated?.();
      }
    } finally {
      setIsSavingStartup(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/servers/${server.id}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: serverNameInput }),
      });
      if (res.ok) {
        onAddNotification?.({
          id: `ren-${Date.now()}`,
          title: "Server Renamed",
          titleBn: "সার্ভারের নাম পরিবর্তিত হয়েছে",
          desc: `Server name set to ${serverNameInput}`,
          descBn: `সার্ভারটির নতুন নাম সংরক্ষণ করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
        onServerUpdated?.();
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleReinstallServer = async () => {
    const confirmMsg =
      lang === "bn"
        ? `আপনি কি নিশ্চিত যে "${server.name}" সার্ভারটি রি-ইনস্টল করতে চান? সব কাস্টম ফাইল মুছে যাবে।`
        : `Are you sure you want to reinstall "${server.name}"? All custom files will be restored to defaults.`;
    if (!confirm(confirmMsg)) return;

    setIsReinstalling(true);
    try {
      const res = await fetch(`/api/servers/${server.id}/reinstall`, { method: "POST" });
      if (res.ok) {
        await fetchFiles();
        await fetchLogs();
        onAddNotification?.({
          id: `reinstall-${Date.now()}`,
          title: "Server Reinstalled",
          titleBn: "সার্ভার রি-ইনস্টল সম্পন্ন",
          desc: `Server ${server.name} reinstalled to pristine ${server.category} state.`,
          descBn: `${server.name} সফলভাবে রি-ইনস্টল হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
        onServerUpdated?.();
      }
    } finally {
      setIsReinstalling(false);
    }
  };

  const tabs: ControlPanelTab[] = [
    "Console",
    "Files",
    "Network",
    "Startup",
    "Settings",
    "Activity",
  ];

  return (
    <div
      id="server-control-panel"
      className="bg-[#111625] text-slate-100 min-h-screen -m-4 sm:-m-6 p-4 sm:p-6 pb-28 space-y-6"
    >
      {/* 1. Top Breadcrumb & Return Nav */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <button
            onClick={onBackToServers}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {lang === "bn" ? "সার্ভারসমূহ" : "My Servers"}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            onClick={onBackToDetails}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {server.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#a78bfa] font-medium">Control Panel</span>
        </div>

        <div className="flex items-center gap-2">
          {allServers && allServers.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium">{lang === "bn" ? "সার্ভার:" : "Server:"}</span>
              <select
                value={server.id}
                onChange={(e) => {
                  const s = allServers.find((srv) => srv.id === e.target.value);
                  if (s && onSelectServer) onSelectServer(s);
                }}
                className="bg-transparent text-purple-300 font-semibold cursor-pointer focus:outline-hidden"
              >
                {allServers.map((srv) => (
                  <option key={srv.id} value={srv.id} className="bg-[#182035] text-white">
                    {srv.name} ({srv.category}) [{srv.status}]
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onBackToDetails}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "ডিটেইলস পেইজ" : "Back to Details"}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs matching Screenshot 3 */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/80">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#251b4b] text-white shadow-xs border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. Server Header & Primary Action Buttons (matching Screenshot 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {server.name}
            </h1>
            <div
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border ${
                isRunning
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-600/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isRunning ? "● RUNNING" : "● STOPPED"}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Node: EU-01 • UUID: {uuid} • Plan: {server.planName || "Mini-v1"}
          </p>
        </div>

        {/* Action Buttons: Start, Restart, Stop (matching Screenshot 3 styles) */}
        <div className="flex items-center gap-2.5">
          {/* Start Button */}
          <button
            onClick={() => handleAction("start")}
            disabled={isActionLoading || isRunning}
            className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              isRunning
                ? "bg-[#33225f]/50 text-slate-500 cursor-not-allowed border border-purple-900/30"
                : "bg-[#5438dc] hover:bg-[#6344f0] text-white active:scale-95 shadow-purple-900/30"
            }`}
          >
            {isActionLoading && !isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Start</span>
          </button>

          {/* Restart Button (Vibrant purple matching Screenshot 3) */}
          <button
            onClick={() => handleAction("restart")}
            disabled={isActionLoading}
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
            <span>Restart</span>
          </button>

          {/* Stop Button (Vibrant red matching Screenshot 3) */}
          <button
            onClick={() => handleAction("stop")}
            disabled={isActionLoading || !isRunning}
            className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              !isRunning
                ? "bg-red-950/40 text-red-400/40 cursor-not-allowed border border-red-900/20"
                : "bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white shadow-red-950/30"
            }`}
          >
            {isActionLoading && isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4 fill-current" />
            )}
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: CONSOLE */}
      {activeTab === "Console" && (
        <div className="space-y-4">
          {/* Live System Resource Stats Pill in Dark Mode */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#182035] border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MEMORY</span>
              <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                {isRunning ? server.ramUsage || "141.88 MB" : "0.00 MB"}{" "}
                <span className="text-xs text-slate-500 font-normal">/ 512 MB</span>
              </span>
            </div>
            <div className="bg-[#182035] border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CPU USAGE</span>
              <span className="text-base sm:text-lg font-mono font-bold text-red-400">
                {isRunning ? server.cpuUsage || "46.36%" : "0.00%"}{" "}
                <span className="text-xs text-slate-500 font-normal">/ 50%</span>
              </span>
            </div>
            <div className="bg-[#182035] border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">DISK SPACE</span>
              <span className="text-base sm:text-lg font-mono font-bold text-sky-400">
                {isRunning ? server.diskUsage || "86.27 MB" : "0.00 MB"}{" "}
                <span className="text-xs text-slate-500 font-normal">/ 2 GB</span>
              </span>
            </div>
            <div className="bg-[#182035] border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NETWORK I/O</span>
              <span className="text-base sm:text-lg font-mono font-bold text-purple-400">
                {isRunning ? "1.84 MB / 4.2 MB" : "0.00 KB"}
              </span>
            </div>
          </div>

          {/* Console Output Screen */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[480px]">
            {/* Terminal Header */}
            <div className="bg-[#121829] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-purple-400" />
                <span className="font-mono font-bold text-slate-300">
                  container@{server.name.toLowerCase()}:~$
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                  bash / pty
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Console Logs"
                >
                  {isCopiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Terminal Logs Output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 bg-[#080c14] text-slate-300 selection:bg-purple-900">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-6 text-center">
                  [Container Initialized for {server.name}] Waiting for server logs. Type "help" or run a command below...
                </div>
              ) : (
                logs.map((log) => {
                  let colorClass = "text-slate-300";
                  if (log.type === "stderr") colorClass = "text-red-400";
                  else if (log.type === "system") colorClass = "text-purple-400";
                  else if (log.type === "pip") colorClass = "text-yellow-400";

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`${colorClass} break-all`}>{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>

            {/* Terminal Command Input Prompt */}
            <form onSubmit={handleSendCommand} className="bg-[#121829] border-t border-slate-800 p-2.5 flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-400 px-1">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type a command (e.g. ls, cat main.py, uptime, clear)..."
                className="flex-1 bg-transparent border-0 text-white font-mono text-xs focus:ring-0 focus:outline-hidden placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: FILES */}
      {activeTab === "Files" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <FolderOpen className="w-4 h-4 text-purple-400" />
              <span>/home/container/user_servers/{server.id}/</span>
              {selectedFile && <span className="text-white font-bold">{selectedFile}</span>}
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-purple-400" />}
                <span>Upload</span>
                <input type="file" onChange={handleUploadFile} className="hidden" />
              </label>
              <button
                onClick={() => setIsNewFileModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#5438dc] hover:bg-[#6344f0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New File</span>
              </button>
              <button
                onClick={fetchFiles}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Refresh Files"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* File Browser & Inline Editor Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* File List */}
            <div className="bg-[#182035] border border-slate-800 rounded-2xl p-3 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <span>Workspace Files ({files.length})</span>
                <span className="text-[10px] text-purple-400 font-normal">server: {server.name}</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1">
                {files.length === 0 ? (
                  <div className="text-slate-500 italic text-xs py-8 text-center">
                    No files found. Click "New File" or "Upload".
                  </div>
                ) : (
                  files.map((file) => {
                    const isSelected = selectedFile === file.name;
                    return (
                      <button
                        key={file.name}
                        onClick={() => {
                          setSelectedFile(file.name);
                          loadFileContent(file.name);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/30 text-white border border-purple-500/40"
                            : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {file.name.endsWith(".py") || file.name.endsWith(".go") || file.name.endsWith(".js") ? (
                            <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Code Editor */}
            <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[460px]">
              <div className="bg-[#121829] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-300 truncate max-w-[200px] sm:max-w-md">
                  {selectedFile || "Select a file to edit"}
                </span>
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteFile(selectedFile)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                    <button
                      onClick={handleSaveFile}
                      disabled={isSavingFile}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save File</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                disabled={!selectedFile}
                placeholder="File contents will appear here..."
                className="flex-1 bg-[#080c14] p-4 text-slate-200 font-mono text-xs resize-none focus:outline-hidden selection:bg-purple-900 border-0"
              />
            </div>
          </div>

          {/* New File Modal */}
          {isNewFileModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#182035] border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-base font-bold text-white">Create New File</h3>
                <form onSubmit={handleCreateNewFile} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">File Name</label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="e.g. main.py or config.json"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewFileModal(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NETWORK */}
      {activeTab === "Network" && (
        <div className="space-y-5 max-w-4xl">
          {/* Allocations Table */}
          <div className="bg-[#182035] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span>Network Allocations</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dedicated IP address and port bindings for {server.name}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-600/40 text-purple-300 text-xs font-mono">
                1 / 2 Allocated
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 text-xs font-mono">
              <div className="bg-[#121829] px-4 py-3 flex items-center justify-between text-slate-400 font-bold uppercase text-[11px]">
                <span>IP & Port</span>
                <span>Alias</span>
                <span>Type</span>
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold">{assignedIp}:{assignedPort}</span>
                </div>
                <span className="text-slate-400">node-eu-01.hostbot.cloud:{assignedPort}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                  PRIMARY
                </span>
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>{assignedIp}:{assignedPort + 1000}</span>
                </div>
                <span className="text-slate-400">node-eu-01.hostbot.cloud:{assignedPort + 1000}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                  HTTP WEBHOOK
                </span>
              </div>
            </div>
          </div>

          {/* SFTP Connection Details */}
          <div className="bg-[#182035] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-sky-400" />
                <span>SFTP File Transfer Details</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect using FileZilla, Cyberduck, or WinSCP to upload large bot packages directly to this server.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">SERVER ADDRESS</span>
                <span className="text-white font-bold truncate block">node-eu-01.hostbot.cloud</span>
              </div>
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">SFTP PORT</span>
                <span className="text-white font-bold block">2022</span>
              </div>
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">USERNAME</span>
                <span className="text-white font-bold block">srv_{uuid}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STARTUP */}
      {activeTab === "Startup" && (
        <div className="space-y-5 max-w-4xl">
          {/* Startup Command */}
          <div className="bg-[#182035] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Startup Command</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The command executed by the container daemon when starting {server.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={startupCmd}
                onChange={(e) => setStartupCmd(e.target.value)}
                className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-hidden"
              />
              <button
                onClick={handleSaveStartup}
                disabled={isSavingStartup}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingStartup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>

            <div className="bg-[#121829] border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
              Container Runtime: <span className="font-mono text-purple-300">{server.category} (isolated container)</span>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-[#182035] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white">Environment Variables (.env)</h2>
            <div className="space-y-2">
              {envVars.map((env, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1/3 bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-2 text-purple-300 font-mono text-xs truncate">
                    {env.key}
                  </span>
                  <input
                    type="text"
                    value={env.value}
                    onChange={(e) => {
                      const updated = [...envVars];
                      updated[idx].value = e.target.value;
                      setEnvVars(updated);
                    }}
                    className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-hidden"
                  />
                  <button
                    onClick={() => setEnvVars(envVars.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Variable */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="VARIABLE_NAME"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                className="w-1/3 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
              />
              <input
                type="text"
                placeholder="Value..."
                value={newEnvVal}
                onChange={(e) => setNewEnvVal(e.target.value)}
                className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
              />
              <button
                onClick={() => {
                  if (!newEnvKey.trim()) return;
                  setEnvVars([...envVars, { key: newEnvKey.trim(), value: newEnvVal.trim() }]);
                  setNewEnvKey("");
                  setNewEnvVal("");
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === "Settings" && (
        <div className="space-y-6 max-w-4xl">
          {/* General Server Details */}
          <div className="bg-[#182035] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-purple-400" />
              <span>Server Preferences</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Server Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={serverNameInput}
                    onChange={(e) => setServerNameInput(e.target.value)}
                    className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-hidden"
                  />
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? "Saving..." : "Save Name"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="bg-[#121829] border border-slate-800 rounded-xl p-3">
                  <span className="text-slate-500 block text-[10px]">INTERNAL SERVER ID</span>
                  <span className="text-slate-200">{server.id}</span>
                </div>
                <div className="bg-[#121829] border border-slate-800 rounded-xl p-3">
                  <span className="text-slate-500 block text-[10px]">NODE LOCATION</span>
                  <span className="text-slate-200">Europe Germany (EU-Node-01)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance: Reinstall Server */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-300">Reinstall Server Container</h3>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Resets this server's workspace to the pristine default starter template for {server.category}. All custom code files will be restored to default.
                </p>
              </div>
            </div>
            <div className="pt-1">
              <button
                onClick={handleReinstallServer}
                disabled={isReinstalling}
                className="px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isReinstalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{isReinstalling ? "Reinstalling..." : "Reinstall Server"}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Delete Server */}
          <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-red-300">Danger Zone: Delete Server</h3>
                <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                  Permanently deletes this server instance, stops its running process, and frees allocated disk storage. This action cannot be reversed.
                </p>
              </div>
            </div>

            {onDeleteServer && (
              <div className="pt-2">
                <button
                  onClick={() => onDeleteServer(server.id, server.name)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Server Instance</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY */}
      {activeTab === "Activity" && (
        <div className="bg-[#182035] border border-slate-800 rounded-2xl p-5 space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-purple-400" />
              <span>Activity Audit Trail</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Recent container events</span>
          </div>

          <div className="divide-y divide-slate-800">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <div className="text-slate-200 font-medium">{act.action}</div>
                  <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                    <span>Actor: {act.user}</span>
                    <span>•</span>
                    <span>IP: {act.ip}</span>
                  </div>
                </div>
                <div className="text-slate-400 text-[11px] shrink-0">{act.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
