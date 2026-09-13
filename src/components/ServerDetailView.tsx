import React, { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Cpu,
  HardDrive,
  Settings,
  Clock,
  Play,
  Square,
  RotateCw,
  Loader2,
  Trash2,
  CheckCircle2,
  Layers,
  Network as NetworkIcon,
} from "lucide-react";
import { ActiveServer, AppNotification } from "../types";

interface ServerDetailViewProps {
  server: ActiveServer;
  lang: "bn" | "en";
  onBack: () => void;
  onGoToPanel: () => void;
  onServerAction: (serverId: string, action: "start" | "stop" | "restart") => Promise<void>;
  onDeleteServer?: (serverId: string, serverName: string) => Promise<void>;
  onAddNotification?: (notif: AppNotification) => void;
}

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({
  server,
  lang,
  onBack,
  onGoToPanel,
  onServerAction,
  onDeleteServer,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [copiedUUID, setCopiedUUID] = useState(false);

  const isRunning = server.status === "RUNNING";

  // UUID derivation from server id or region
  const uuid = (server.region.split("•")[1] || server.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8)).trim();

  // Created and expiration dates calculation
  const createdDate = server.createdAt ? new Date(server.createdAt) : new Date("2026-08-27T00:00:00Z");
  const expirationDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAction = async (action: "start" | "stop" | "restart") => {
    setIsActionLoading(true);
    try {
      await onServerAction(server.id, action);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(uuid);
    setCopiedUUID(true);
    setTimeout(() => setCopiedUUID(false), 2000);
  };

  // Numerical calculations for resource progress bars
  // RAM: Parse e.g. "141.88 MB" from server.ramUsage or default
  const ramNum = isRunning ? parseFloat(server.ramUsage) || 141.88 : 0;
  const maxRam = 512;
  const ramPercent = Math.min(Math.round((ramNum / maxRam) * 100), 100);

  // CPU: Parse e.g. "46.36%" or "53%"
  const cpuNum = isRunning ? parseFloat(server.cpuUsage) || 53 : 0;
  const cpuLimit = 50;
  const cpuPercent = Math.min(Math.round((cpuNum / 100) * 100), 100);

  // Disk: Parse e.g. "86.27 MB"
  const diskNum = isRunning ? parseFloat(server.diskUsage) || 86.27 : 0;
  const maxDiskMb = 2048; // 2 GB
  const diskPercent = Math.min(Math.round((diskNum / maxDiskMb) * 100), 100);

  return (
    <div id="server-detail-view" className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
      {/* 1. Top Navigation Bar (matching Screenshot 1) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold text-sm sm:text-base py-1.5 px-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span>{lang === "bn" ? "সার্ভার তালিকায় ফিরুন" : "Back to My Servers"}</span>
        </button>

        {/* Center & Right: Live Status Badge + Go to Panel Button */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
              isRunning
                ? "bg-[#e6f8ef] text-[#059669] border-emerald-200/90"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? "bg-[#10b981] animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="tracking-wide uppercase font-mono">{isRunning ? "RUNNING" : "STOPPED"}</span>
          </div>

          {/* Go to Panel Button (prominent purple button matching Screenshot 1) */}
          <button
            onClick={onGoToPanel}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#5438dc] hover:bg-[#472ecc] active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>{lang === "bn" ? "কন্ট্রোল প্যানেলে যান" : "Go to Panel"}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Server Identity Card (matching Screenshot 1) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs relative overflow-hidden space-y-3 hover:shadow-xs transition-shadow">
        <div className="flex items-start gap-4">
          {/* 2-Tier Stacked Server Icon */}
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <div className="w-7 h-7 flex flex-col justify-center gap-1.5 text-[#5438dc]">
              <div className="w-7 h-3 rounded-xs border-2 border-current flex items-center justify-end px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
              <div className="w-7 h-3 rounded-xs border-2 border-current flex items-center justify-end px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {server.name}
            </h1>

            {/* Region & UUID pills */}
            <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-medium">
                <NetworkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>EU</span>
              </div>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleCopyUUID}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-medium hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Click to copy UUID"
              >
                <span>UUID: {uuid}</span>
                {copiedUUID && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
              </button>
            </div>

            {/* Egg Badge */}
            <div className="pt-1">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                Egg: <span className="font-semibold text-[#5438dc]">{server.category || "Generic"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Emerald accent bar along the bottom of the card matching Screenshot 1 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400" />
      </div>

      {/* 3. Resource Utilization Card (matching Screenshot 1 & 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#5438dc]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {lang === "bn" ? "রিসোর্স ব্যবহার (Resource Utilization)" : "Resource Utilization"}
            </h2>
          </div>

          <div className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200/90 text-sky-700 text-[11px] font-bold font-mono tracking-wider uppercase">
            LIVE STATUS: {isRunning ? "RUNNING" : "STOPPED"}
          </div>
        </div>

        {/* Resource Boxes Grid */}
        <div className="space-y-3.5">
          {/* Box 1: CPU Limit */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>CPU LIMIT</span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {isRunning ? `${cpuNum}%` : "0%"} <span className="text-sm font-normal text-slate-400">/ {cpuLimit}%</span>
            </div>
            {/* Progress line */}
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${isRunning ? Math.min((cpuNum / cpuLimit) * 100, 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Box 2: Allocated Memory */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>ALLOCATED MEMORY</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {isRunning ? `${ramNum} MB` : "0.00 MB"}{" "}
              <span className="text-sm font-normal text-slate-400">/ {maxRam} MB</span>
            </div>
            {/* Progress line */}
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${isRunning ? ramPercent : 0}%` }}
              />
            </div>
          </div>

          {/* Box 3: Disk Space */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>DISK SPACE</span>
              <HardDrive className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {isRunning ? `${diskNum} MB` : "0.00 MB"}{" "}
              <span className="text-sm font-normal text-slate-400">/ 2 GB</span>
            </div>
            {/* Progress line */}
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${isRunning ? diskPercent : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Server Information Card (matching Screenshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#5438dc]" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === "bn" ? "সার্ভার তথ্য (Server Information)" : "Server Information"}
          </h2>
        </div>

        {/* Rows with divider */}
        <div className="divide-y divide-slate-100 text-xs sm:text-sm font-sans">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 font-medium">Created On</span>
            <span className="font-semibold text-slate-800 font-mono">{formatDate(createdDate)}</span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 font-medium">Expiration Date</span>
            <span className="font-semibold text-slate-800 font-mono">{formatDate(expirationDate)}</span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 font-medium">Time Remaining</span>
            <span className="font-bold text-slate-900 font-mono tracking-wider uppercase">
              {server.daysLeft ? server.daysLeft.toUpperCase() : "30 DAYS LEFT"}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 font-medium">Bundled Server Plan</span>
            <span className="font-bold text-slate-900 font-mono tracking-wider uppercase">
              {server.planName ? server.planName.toUpperCase() : "MINI-V1"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Quick Controls & Direct Actions */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={() => handleAction("stop")}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              <span>{lang === "bn" ? "সার্ভার বন্ধ করুন" : "Stop Server"}</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction("start")}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{lang === "bn" ? "সার্ভার চালু করুন" : "Start Server"}</span>
            </button>
          )}

          <button
            onClick={() => handleAction("restart")}
            disabled={isActionLoading}
            className="px-4 py-2.5 rounded-xl bg-[#5438dc] hover:bg-[#472ecc] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
            <span>{lang === "bn" ? "রিস্টার্ট" : "Restart"}</span>
          </button>
        </div>

        {/* Delete button */}
        {onDeleteServer && (
          <button
            onClick={() => onDeleteServer(server.id, server.name)}
            disabled={isActionLoading}
            className="px-4 py-2.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === "bn" ? "সার্ভার মুছুন" : "Delete Server"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
