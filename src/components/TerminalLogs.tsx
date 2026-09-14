import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  ArrowDown,
  Search,
  Activity,
  DownloadCloud,
} from "lucide-react";
import { BotLog } from "../types";

interface TerminalLogsProps {
  logs: BotLog[];
  lang: "bn" | "en";
  onClearLogs: () => void;
  status: "stopped" | "installing" | "running" | "error";
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  lang,
  onClearLogs,
  status,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when logs change
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Handle manual scroll to toggle auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (isNearBottom !== autoScroll) {
      setAutoScroll(isNearBottom);
    }
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telegram-bot-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = searchQuery.trim()
    ? logs.filter(
        (l) =>
          l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  const getTypeStyle = (type: BotLog["type"]) => {
    switch (type) {
      case "stderr":
        return "text-rose-400 font-semibold";
      case "pip":
        return "text-amber-300";
      case "system":
        return "text-sky-300 font-semibold";
      case "stdout":
        return "text-emerald-300";
      default:
        return "text-slate-300";
    }
  };

  return (
    <div id="terminal-logs-card" className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* macOS style dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 font-mono">
            {lang === "bn" ? "লাইভ কনসোল টার্মিনাল (Live Logs)" : "Live Console Terminal"}
          </span>

          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>{logs.length} {lang === "bn" ? "লাইন" : "lines"}</span>
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "bn" ? "লগ খুঁজুন..." : "Filter logs..."}
              className="bg-slate-800/80 text-slate-200 text-xs font-mono pl-6 pr-2 py-1 rounded border border-slate-700 focus:outline-hidden focus:border-sky-500 w-28 sm:w-36"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors font-mono ${
              autoScroll
                ? "bg-sky-950 text-sky-300 border border-sky-800"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Auto scroll to bottom"
          >
            <ArrowDown className="w-3 h-3" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          {/* Copy logs */}
          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-40"
            title={lang === "bn" ? "লগ কপি করুন" : "Copy logs"}
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download logs */}
          <button
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-40"
            title={lang === "bn" ? "লগ ডাউনলোড করুন" : "Download logs"}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
          </button>

          {/* Clear logs */}
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded transition-colors disabled:opacity-40"
            title={lang === "bn" ? "লগ মুছুন" : "Clear logs"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 select-text bg-slate-950/90 text-slate-200 leading-relaxed"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <Terminal className="w-8 h-8 opacity-40" />
            <p>
              {lang === "bn"
                ? "টার্মিনাল প্রস্তুত। বট চালু করুন অথবা প্যাকেজ ইনস্টল করুন।"
                : "Terminal ready. Start the bot or install requirements to view logs."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/40 px-1 py-0.5 rounded">
              <span className="text-slate-600 shrink-0 text-[11px] select-none">
                {log.timestamp}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 select-none ${
                  log.type === "stderr"
                    ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                    : log.type === "pip"
                    ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                    : log.type === "system"
                    ? "bg-sky-950/80 text-sky-300 border border-sky-800"
                    : "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                }`}
              >
                {log.type}
              </span>
              <pre
                className={`flex-1 whitespace-pre-wrap break-all font-mono text-xs ${getTypeStyle(
                  log.type
                )}`}
              >
                {log.message}
              </pre>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Bottom status strip */}
      <div className="bg-slate-900/90 px-4 py-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "running"
                ? "bg-emerald-400 animate-pulse"
                : status === "installing"
                ? "bg-amber-400 animate-pulse"
                : "bg-slate-500"
            }`}
          />
          <span className="capitalize">{status}</span>
        </div>
        <div>
          <span>UTF-8 • Linux x86_64</span>
        </div>
      </div>
    </div>
  );
};
