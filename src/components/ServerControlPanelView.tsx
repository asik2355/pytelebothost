import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Terminal as TerminalIcon,
  FolderOpen,
  Folder,
  FolderPlus,
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
  MoreHorizontal,
  Download,
  Edit3,
  X,
  Archive,
  File,
  Database,
  Package,
  Zap,
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
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(false);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Files State
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [isNewFileModal, setIsNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isNewDirModal, setIsNewDirModal] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [isRenameModal, setIsRenameModal] = useState(false);
  const [renameOldName, setRenameOldName] = useState("");
  const [renameNewName, setRenameNewName] = useState("");
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [isRefreshingFiles, setIsRefreshingFiles] = useState(false);
  const [isInstallingDeps, setIsInstallingDeps] = useState(false);

  // Backups State
  const [backups, setBackups] = useState<Array<{ id: string; name: string; size: number; createdAt: string }>>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState<string | null>(null);

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

  const [liveStats, setLiveStats] = useState<{
    ramUsage?: string;
    cpuUsage?: string;
    diskUsage?: string;
    status?: "RUNNING" | "STOPPED";
  }>({
    ramUsage: server.ramUsage,
    cpuUsage: server.cpuUsage,
    diskUsage: server.diskUsage,
    status: server.status,
  });

  const effectiveStatus = liveStats.status || server.status;
  const isRunning = effectiveStatus === "RUNNING";
  const uuid = (server.region.split("•")[1] || server.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8)).trim();
  const assignedPort = server.port || 25565;
  const assignedIp = server.ip || "208.72.218.137";

  // Fetch per-server details & config
  const fetchServerDetails = async () => {
    try {
      const res = await apiFetch(`/api/servers/${server.id}/details`);
      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          setLiveStats({
            ramUsage: data.server.ramUsage,
            cpuUsage: data.server.cpuUsage,
            diskUsage: data.server.diskUsage,
            status: data.server.status,
          });
        }
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
      const res = await apiFetch(`/api/servers/${server.id}/logs`);
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
  const fetchFiles = async (silent = false) => {
    if (!silent) setIsRefreshingFiles(true);
    try {
      const res = await apiFetch(`/api/servers/${server.id}/files`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files)) {
          setFiles(data.files);
          setSelectedFile((prev) => {
            if (prev && data.files.some((f: any) => f.name === prev)) {
              return prev;
            }
            return data.files.length > 0 ? data.files[0].name : null;
          });
        }
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setIsRefreshingFiles(false);
    }
  };

  const loadFileContent = async (filename: string) => {
    try {
      const res = await apiFetch(`/api/servers/${server.id}/files/${encodeURIComponent(filename)}`);
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
    const interval = setInterval(() => {
      fetchLogs();
      fetchServerDetails();
    }, 2500);
    return () => clearInterval(interval);
  }, [server.id]);

  // Auto-refresh file list when on Files tab or when server is running
  useEffect(() => {
    if (activeTab === "Files") {
      fetchFiles(true);
      const filesInterval = setInterval(() => {
        fetchFiles(true);
      }, 3000);
      return () => clearInterval(filesInterval);
    }
  }, [activeTab, server.id]);

  // Keep page view steady at top when entering control panel
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Only auto-scroll inside the console terminal container if enabled by user, never moving the window
  useEffect(() => {
    if (activeTab === "Console" && autoScrollLogs && consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [logs, activeTab, autoScrollLogs]);

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
      const res = await apiFetch(`/api/servers/${server.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      if (res.ok) {
        await fetchLogs();
        if (consoleContainerRef.current) {
          consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
        }
      }
    } catch {
      // ignore
    }
  };

  const handleInstallDependencies = async () => {
    setIsInstallingDeps(true);
    try {
      const res = await apiFetch(`/api/servers/${server.id}/install`, { method: "POST" });
      if (res.ok) {
        onAddNotification?.({
          id: `install-${Date.now()}`,
          title: "Package Installation Triggered",
          titleBn: "ডিপেন্ডেন্সি ইনস্টলেশন শুরু হয়েছে",
          desc: "Installing packages from requirements.txt...",
          descBn: "requirements.txt এর প্যাকেজসমূহ ইনস্টল করা হচ্ছে...",
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
        setTimeout(fetchLogs, 1200);
      }
    } finally {
      setIsInstallingDeps(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    const isReqs = selectedFile === "requirements.txt" || selectedFile === "package.json";
    try {
      const res = await apiFetch(`/api/servers/${server.id}/files/${encodeURIComponent(selectedFile)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent }),
      });
      if (res.ok) {
        onAddNotification?.({
          id: `file-save-${Date.now()}`,
          title: isReqs ? "Requirements Updated & Installing" : "File Saved",
          titleBn: isReqs ? "Requirements সেভ হয়েছে ও লাইব্রেরি ইনস্টল হচ্ছে" : "ফাইল সংরক্ষণ হয়েছে",
          desc: isReqs ? `Updated ${selectedFile}. Dependencies are auto-installing.` : `File "${selectedFile}" updated in ${server.name}.`,
          descBn: isReqs ? `${selectedFile} সেভ হয়েছে। স্বয়ংক্রিয়ভাবে লাইব্রেরি ইনস্টল হচ্ছে।` : `ফাইল "${selectedFile}" সার্ভার ${server.name}-এ সেভ হয়েছে।`,
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
        if (isReqs) {
          setTimeout(fetchLogs, 1500);
        }
      }
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleDeleteFile = (filename: string) => {
    setFileToDelete(filename);
    setActiveFileMenu(null);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    const filename = fileToDelete;
    setIsDeletingFile(true);
    try {
      const res = await apiFetch(`/api/servers/${server.id}/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.name !== filename));
        await fetchFiles();
        if (selectedFile === filename) {
          setSelectedFile(null);
          setFileContent("");
          setIsEditorModalOpen(false);
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
    } finally {
      setIsDeletingFile(false);
      setFileToDelete(null);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const fileList: File[] = Array.from(rawFiles);
    // Limit to max 10 files at a time
    const filesToUpload = fileList.slice(0, 10);
    const hasMoreThan10 = fileList.length > 10;

    setIsUploading(true);
    const formData = new FormData();
    for (const file of filesToUpload) {
      formData.append("files", file);
    }

    try {
      const res = await apiFetch(`/api/servers/${server.id}/files/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchFiles();
        const firstFile = filesToUpload[0];
        if (firstFile) {
          setSelectedFile(firstFile.name);
          loadFileContent(firstFile.name);
        }

        const namesSummary = filesToUpload.map((f) => f.name).join(", ");
        onAddNotification?.({
          id: `upload-${Date.now()}`,
          title: filesToUpload.length > 1 ? `${filesToUpload.length} Files Uploaded` : "File Uploaded",
          titleBn: filesToUpload.length > 1 ? `${filesToUpload.length}টি ফাইল আপলোড হয়েছে` : "ফাইল আপলোড হয়েছে",
          desc: hasMoreThan10
            ? `Uploaded ${filesToUpload.length} files (Max limit 10): ${namesSummary}`
            : `Uploaded ${filesToUpload.length} file(s): ${namesSummary}`,
          descBn: hasMoreThan10
            ? `সর্বোচ্চ ১০টি ফাইল আপলোড হয়েছে: ${namesSummary}`
            : `${filesToUpload.length}টি ফাইল সফলভাবে আপলোড হয়েছে: ${namesSummary}`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
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
      await apiFetch(`/api/servers/${server.id}/files/${encodeURIComponent(cleanName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `# New file for ${server.name}\n` }),
      });
      await fetchFiles();
      setSelectedFile(cleanName);
      setFileContent(`# New file for ${server.name}\n`);
      setIsNewFileModal(false);
      setNewFileName("");
      setIsEditorModalOpen(true);
    } catch {
      // ignore
    }
  };

  const handleCreateNewDir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim()) return;
    const cleanName = newDirName.trim();

    try {
      const res = await apiFetch(`/api/servers/${server.id}/directories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dirName: cleanName }),
      });
      if (res.ok) {
        await fetchFiles();
        setIsNewDirModal(false);
        setNewDirName("");
        onAddNotification?.({
          id: `dir-${Date.now()}`,
          title: "Directory Created",
          titleBn: "ফোল্ডার তৈরি হয়েছে",
          desc: `Created directory /${cleanName} in ${server.name}`,
          descBn: `${server.name}-এ নতুন ফোল্ডার তৈরি হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameNewName.trim() || !renameOldName) return;
    try {
      const res = await apiFetch(`/api/servers/${server.id}/files/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: renameOldName, newName: renameNewName.trim() }),
      });
      if (res.ok) {
        await fetchFiles();
        if (selectedFile === renameOldName) {
          setSelectedFile(renameNewName.trim());
        }
        setIsRenameModal(false);
        setRenameOldName("");
        setRenameNewName("");
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadFile = (filename: string) => {
    const filePath = `/api/servers/${server.id}/files/${encodeURIComponent(filename)}`;
    apiFetch(filePath)
      .then((r) => r.json())
      .then((data) => {
        if (data.content !== undefined) {
          const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
  };

  // Backups Handlers
  const fetchBackups = async () => {
    try {
      const res = await apiFetch(`/api/servers/${server.id}/backups`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.backups)) setBackups(data.backups);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await apiFetch(`/api/servers/${server.id}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchBackups();
        onAddNotification?.({
          id: `bkp-${Date.now()}`,
          title: "Backup Created",
          titleBn: "ব্যাকআপ তৈরি হয়েছে",
          desc: `Full server backup snapshot stored safely for ${server.name}.`,
          descBn: `${server.name}-এর ব্যাকআপ সংরক্ষণ করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm(lang === "bn" ? `আপনি কি ব্যাকআপ ${backupId} রিস্টোর করতে চান?` : `Restore server workspace to snapshot ${backupId}?`)) return;
    setIsRestoringBackup(backupId);
    try {
      const res = await apiFetch(`/api/servers/${server.id}/backups/${backupId}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchFiles();
        await fetchLogs();
        onAddNotification?.({
          id: `rst-${Date.now()}`,
          title: "Backup Restored",
          titleBn: "ব্যাকআপ রিস্টোর সম্পন্ন",
          desc: `Workspace files restored from snapshot ${backupId}.`,
          descBn: `ব্যাকআপ ফাইল সফলভাবে রিস্টোর করা হয়েছে।`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false,
        });
      }
    } finally {
      setIsRestoringBackup(null);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm(lang === "bn" ? `ব্যাকআপ মুছে ফেলতে চান?` : `Delete backup ${backupId}?`)) return;
    try {
      const res = await apiFetch(`/api/servers/${server.id}/backups/${backupId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBackups();
      }
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
      await apiFetch(`/api/servers/${server.id}/logs/clear`, { method: "POST" });
      setLogs([]);
    } catch {
      // ignore
    }
  };

  const handleSaveStartup = async () => {
    setIsSavingStartup(true);
    try {
      const res = await apiFetch(`/api/servers/${server.id}/config`, {
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
      const res = await apiFetch(`/api/servers/${server.id}/config`, {
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
      const res = await apiFetch(`/api/servers/${server.id}/reinstall`, { method: "POST" });
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
      className="bg-[#0e1320] text-slate-100 min-h-screen -m-4 sm:-m-6 p-4 sm:p-6 pb-28 space-y-6"
    >
      {/* 1. Top Breadcrumb & Return Nav */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
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
            className="hover:text-white transition-colors cursor-pointer font-medium"
          >
            {server.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#a78bfa] font-medium">Control Panel</span>
        </div>

        <div className="flex items-center gap-2">
          {allServers && allServers.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
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

      {/* 2. Top Navigation Tabs (Matching Screenshot 1 & 2) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/80">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#251849] text-white shadow-sm border border-purple-500/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONSOLE (Matching Screenshot 1) */}
      {activeTab === "Console" && (
        <div className="space-y-4">
          {/* Header Row: Server Name & 3 Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
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

            {/* Action Buttons: Start, Restart, Stop (Matching Screenshot 1) */}
            <div className="flex items-center gap-2.5">
              {/* Start Button */}
              <button
                onClick={() => handleAction("start")}
                disabled={isActionLoading || isRunning}
                className={`px-6 sm:px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  isRunning
                    ? "bg-[#2d2256]/60 text-purple-300/40 cursor-not-allowed border border-purple-900/30"
                    : "bg-[#653bf0] hover:bg-[#7248f7] active:scale-95 text-white shadow-purple-950/30"
                }`}
              >
                {isActionLoading && !isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Start</span>
              </button>

              {/* Restart Button (Vibrant purple) */}
              <button
                onClick={() => handleAction("restart")}
                disabled={isActionLoading}
                className="px-6 sm:px-7 py-2.5 rounded-xl bg-[#6f42ec] hover:bg-[#7c4ef7] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCw className="w-3.5 h-3.5" />
                )}
                <span>Restart</span>
              </button>

              {/* Stop Button (Vibrant red) */}
              <button
                onClick={() => handleAction("stop")}
                disabled={isActionLoading || !isRunning}
                className={`px-6 sm:px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  !isRunning
                    ? "bg-red-950/30 text-red-400/30 cursor-not-allowed border border-red-900/20"
                    : "bg-[#e50914] hover:bg-[#cc0812] active:scale-95 text-white shadow-red-950/30"
                }`}
              >
                {isActionLoading && isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Stop</span>
              </button>
            </div>
          </div>

          {/* Console Terminal Container */}
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
            {/* Terminal Header */}
            <div className="bg-[#111726] px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <TerminalIcon className="w-4 h-4 text-purple-400" />
                <span className="font-bold tracking-wider uppercase text-slate-100 text-xs sm:text-sm font-mono">
                  LIVE CONSOLE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Cloud Instance: Online
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                  <span>Isolated Runtime: Active</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Console Logs"
                >
                  {isCopiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Terminal Logs Area */}
            <div
              ref={consoleContainerRef}
              className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 bg-[#060910] text-slate-300 selection:bg-purple-900"
            >
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
          </div>

          {/* Live System Resource Stats Bar (Placed below the console) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-[#121828] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MEMORY</span>
              <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                {isRunning ? (liveStats.ramUsage || server.ramUsage || "0.00 MB").replace(/RAM/i, "").trim() : "0.00 MB"}{" "}
                <span className="text-xs text-slate-500 font-normal">/ 512 MB</span>
              </span>
            </div>
            <div className="bg-[#121828] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CPU USAGE</span>
              <span className="text-base sm:text-lg font-mono font-bold text-red-400">
                {isRunning ? (liveStats.cpuUsage || server.cpuUsage || "0.00%").replace(/CPU/i, "").trim() : "0.00%"}{" "}
                <span className="text-xs text-slate-500 font-normal">/ 50%</span>
              </span>
            </div>
            <div className="bg-[#121828] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">DISK SPACE</span>
              <span className="text-base sm:text-lg font-mono font-bold text-sky-400">
                {(liveStats.diskUsage || server.diskUsage || "0.00 KB").replace(/Disk/i, "").trim()}{" "}
                <span className="text-xs text-slate-500 font-normal">/ 2 GB</span>
              </span>
            </div>
            <div className="bg-[#121828] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NETWORK I/O</span>
              <span className="text-base sm:text-lg font-mono font-bold text-purple-400">
                {isRunning ? "1.84 MB / 4.2 MB" : "0.00 KB"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FILES (Matching Screenshot 2) */}
      {activeTab === "Files" && (
        <div className="space-y-4">
          {/* Top Bar: Path on Left & 3 Action Buttons in One Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1">
            {/* Path Breadcrumb: [ ] / home / container / */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-slate-300 bg-[#121828] border border-slate-800/80 px-3.5 py-2.5 rounded-xl shrink-0">
              <input
                type="checkbox"
                aria-label="Select All Files"
                className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-slate-500">/</span>
              <span className="text-slate-400 hover:text-white cursor-pointer">home</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200 font-semibold">container</span>
              <span className="text-slate-500">/</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-[10px] text-purple-300 hidden sm:inline">
                Direct VPS Sync
              </span>
            </div>

            {/* Actions Toolbar - Always Single Row */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 w-full lg:w-auto">
              {/* Refresh Files Button */}
              <button
                type="button"
                onClick={() => fetchFiles(false)}
                disabled={isRefreshingFiles}
                className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-[#1e263d] hover:bg-[#25304c] border border-slate-700/80 active:scale-95 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                title="Refresh Files"
              >
                <RefreshCw className={`w-4 h-4 text-sky-400 ${isRefreshingFiles ? "animate-spin" : ""}`} />
              </button>

              {/* Create Directory Button */}
              <button
                onClick={() => setIsNewDirModal(true)}
                className="flex-1 sm:flex-initial px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#6f42ec] hover:bg-[#7c4ef7] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Create Directory</span>
              </button>

              {/* Upload Button */}
              <label className="flex-1 sm:flex-initial px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#6f42ec] hover:bg-[#7c4ef7] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shadow-sm">
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
                ) : (
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                )}
                <span>Upload</span>
                <input type="file" multiple onChange={handleUploadFile} className="hidden" />
              </label>

              {/* New File Button */}
              <button
                onClick={() => setIsNewFileModal(true)}
                className="flex-1 sm:flex-initial px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#6f42ec] hover:bg-[#7c4ef7] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>New File</span>
              </button>
            </div>
          </div>

          {/* Files List Cards (Stacked rounded cards matching Screenshot 2) */}
          <div className="space-y-2.5 pt-1">
            {files.length === 0 ? (
              <div className="bg-[#121828] border border-slate-800 rounded-2xl p-10 text-center text-slate-500 italic text-sm">
                No files found in workspace. Click "New File", "Create Directory", or "Upload".
              </div>
            ) : (
              files.map((file) => {
                const isDir = file.isDirectory;
                const isMenuOpen = activeFileMenu === file.name;
                const isDb = file.name.endsWith(".db") || file.name.endsWith(".sqlite") || file.name.endsWith(".sqlite3") || file.name.endsWith(".sql");
                const isJson = file.name.endsWith(".json");
                const isCode = file.name.endsWith(".py") || file.name.endsWith(".go") || file.name.endsWith(".js") || file.name.endsWith(".ts");
                const isReqs = file.name === "requirements.txt";

                return (
                  <div
                    key={file.name}
                    className="bg-[#121828] hover:bg-[#161d30] border border-slate-800/90 hover:border-purple-500/40 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 transition-all group"
                  >
                    {/* Left: Checkbox + Icon + File Name */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        aria-label={`Select ${file.name}`}
                        className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />

                      <div
                        onClick={() => {
                          if (!isDir) {
                            setSelectedFile(file.name);
                            loadFileContent(file.name);
                            setIsEditorModalOpen(true);
                          }
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        {isDir ? (
                          <Folder className="w-5 h-5 text-sky-400 shrink-0" />
                        ) : isDb ? (
                          <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : isJson ? (
                          <FileCode className="w-5 h-5 text-amber-400 shrink-0" />
                        ) : isCode ? (
                          <FileCode className="w-5 h-5 text-purple-400 shrink-0" />
                        ) : isReqs ? (
                          <Package className="w-5 h-5 text-sky-400 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                        )}

                        <span className="font-mono text-sm text-slate-200 group-hover:text-white font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                    </div>

                    {/* Right: File Size + Three-dot Menu */}
                    <div className="flex items-center gap-3 shrink-0 relative">
                      {!isDir && (
                        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      )}

                      <button
                        onClick={() => setActiveFileMenu(isMenuOpen ? null : file.name)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="File actions"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-9 z-30 w-44 bg-[#1a2238] border border-slate-700 rounded-xl shadow-2xl py-1.5 text-xs font-medium text-slate-200">
                          {!isDir && (
                            <button
                              onClick={() => {
                                setSelectedFile(file.name);
                                loadFileContent(file.name);
                                setIsEditorModalOpen(true);
                                setActiveFileMenu(null);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-purple-600/20 hover:text-white flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                              <span>Edit File</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRenameOldName(file.name);
                              setRenameNewName(file.name);
                              setIsRenameModal(true);
                              setActiveFileMenu(null);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-purple-600/20 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                            <span>Rename</span>
                          </button>
                          {!isDir && (
                            <button
                              onClick={() => {
                                handleDownloadFile(file.name);
                                setActiveFileMenu(null);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-purple-600/20 hover:text-white flex items-center gap-2 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Download</span>
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-700/60" />
                          <button
                            onClick={() => {
                              handleDeleteFile(file.name);
                              setActiveFileMenu(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer matching Screenshot 2 */}
          <div className="text-center py-6 text-xs text-slate-500 font-mono border-t border-slate-800/80 mt-8">
            bot-host.xyz © 2026 - now
          </div>

          {/* Create Directory Modal */}
          {isNewDirModal && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#182035] border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-purple-400" />
                    <span>Create Directory</span>
                  </h3>
                  <button onClick={() => setIsNewDirModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateNewDir} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Directory Name</label>
                    <input
                      type="text"
                      value={newDirName}
                      onChange={(e) => setNewDirName(e.target.value)}
                      placeholder="e.g. src or utils"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewDirModal(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#6f42ec] hover:bg-[#7c4ef7] text-white text-xs font-semibold cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* New File Modal */}
          {isNewFileModal && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#182035] border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-purple-400" />
                    <span>Create New File</span>
                  </h3>
                  <button onClick={() => setIsNewFileModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#6f42ec] hover:bg-[#7c4ef7] text-white text-xs font-semibold cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rename Modal */}
          {isRenameModal && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#182035] border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                    <span>Rename {renameOldName}</span>
                  </h3>
                  <button onClick={() => setIsRenameModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleRename} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">New Name</label>
                    <input
                      type="text"
                      value={renameNewName}
                      onChange={(e) => setRenameNewName(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRenameModal(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#6f42ec] hover:bg-[#7c4ef7] text-white text-xs font-semibold cursor-pointer"
                    >
                      Rename
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Code Editor Modal / Drawer */}
          {isEditorModalOpen && selectedFile && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
              <div className="bg-[#0b0f19] border border-slate-700 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Editor Header */}
                <div className="bg-[#121829] px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-mono text-xs sm:text-sm font-bold text-white truncate">
                      {selectedFile}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                      /home/container/
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveFile}
                      disabled={isSavingFile}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteFile(selectedFile);
                      }}
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 hover:text-red-200 cursor-pointer transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditorModalOpen(false)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Close Editor"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  placeholder="File contents..."
                  className="flex-1 bg-[#060910] p-4 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-hidden selection:bg-purple-900 border-0"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Delete File Confirmation Modal */}
          {fileToDelete && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#182035] border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <span>{lang === "bn" ? "ফাইল ডিলিট করবেন?" : "Delete File?"}</span>
                  </h3>
                  <button onClick={() => setFileToDelete(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === "bn"
                    ? `আপনি কি নিশ্চিত যে "${fileToDelete}" ফাইলটি স্থায়ীভাবে ডিলিট করতে চান?`
                    : `Are you sure you want to permanently delete "${fileToDelete}" from the workspace?`}
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setFileToDelete(null)}
                    disabled={isDeletingFile}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteFile}
                    disabled={isDeletingFile}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{lang === "bn" ? "ডিলিট করুন" : "Delete"}</span>
                  </button>
                </div>
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
