import React, { useState, useEffect } from "react";
import {
  Server,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Terminal,
  Database,
  Cpu,
  Box,
  Layers,
  Sparkles,
} from "lucide-react";
import { getVpsApiBaseUrl, getVpsApiSecret, saveVpsConfig } from "../lib/api";

interface VpsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "bn" | "en";
}

export const VpsConnectionModal: React.FC<VpsConnectionModalProps> = ({
  isOpen,
  onClose,
  lang = "en",
}) => {
  const [vpsUrl, setVpsUrl] = useState("");
  const [vpsSecret, setVpsSecret] = useState("");
  const [activeTab, setActiveTab] = useState<"connect" | "vercel" | "vps-script">("connect");
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
    details?: any;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVpsUrl(getVpsApiBaseUrl());
      setVpsSecret(getVpsApiSecret());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const startTime = performance.now();

    try {
      const targetBase = vpsUrl.trim() ? vpsUrl.trim().replace(/\/+$/, "") : "";
      const testEndpoint = targetBase ? `${targetBase}/api/pipeline/architecture` : "/api/pipeline/architecture";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (vpsSecret.trim()) {
        headers["x-vps-api-secret"] = vpsSecret.trim();
      }

      const res = await fetch(testEndpoint, {
        method: "GET",
        headers,
      });

      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: lang === "bn" ? "VPS ব্যাকএন্ডের সাথে সফলভাবে কানেক্ট হয়েছে!" : "Successfully connected to VPS Backend API!",
          latency,
          details: data,
        });
      } else {
        setTestResult({
          success: false,
          message: `VPS responded with error status: ${res.status} ${res.statusText}`,
          latency,
        });
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setTestResult({
        success: false,
        message: err.message || (lang === "bn" ? "কানেকশন ফেইল্ড! অনুগ্রহ করে VPS IP, পোর্ট (3000) ও CORS চেক করুন।" : "Connection failed! Please check VPS IP, port 3000, and firewall/CORS."),
        latency,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveVpsConfig(vpsUrl, vpsSecret);
    setTestResult({
      success: true,
      message: lang === "bn" ? "VPS কনফিগারেশন সেভ হয়েছে! পেজ রিলোড করা হচ্ছে..." : "VPS configuration saved! Reloading configuration...",
    });
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1000);
  };

  const handleResetToDefault = () => {
    saveVpsConfig("", "");
    setVpsUrl("");
    setVpsSecret("");
    setTestResult({
      success: true,
      message: lang === "bn" ? "ডিফল্ট লোকাল প্রক্সি এপিআই-তে রিসেট করা হয়েছে।" : "Reset to default relative API endpoint.",
    });
  };

  const sampleDockerCompose = `version: '3.8'

services:
  telegram-bot-backend:
    image: node:20-alpine
    container_name: bot_host_backend
    restart: always
    working_dir: /app
    volumes:
      - .:/app
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/bot_workspaces:/home/container
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - VPS_API_SECRET=${vpsSecret || "your_secure_api_token_here"}
    command: sh -c "npm install && npm start"
`;

  const sampleUbuntuSetupCmd = `# 1. Update system & install Docker
sudo apt update && sudo apt install -y docker.io docker-compose python3 python3-pip git

# 2. Clone repository on your VPS
git clone https://github.com/YOUR_GITHUB_USER/YOUR_REPO.git /opt/bot-host
cd /opt/bot-host

# 3. Install dependencies & start VPS Backend Server
npm install
npm run build
npm start

# Or run with PM2 for 24/7 auto-restart:
sudo npm install -g pm2
pm2 start dist/server.cjs --name bot-backend
pm2 startup && pm2 save`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {lang === "bn" ? "Vercel ➔ VPS কানেকশন ম্যানেজার" : "Vercel ➔ VPS API Connection Manager"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HYBRID ARCHITECTURE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === "bn"
                  ? "Vercel-এ থাকা Frontend ওয়েবসাইট থেকে সরাসরি আপনার VPS Backend/API-এর সাথে যুক্ত করুন"
                  : "Connect your Vercel-hosted frontend directly to your dedicated VPS backend & Docker bots"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800 flex items-center gap-2 bg-slate-900/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("connect")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "connect"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "VPS API কনফিগারেশন" : "VPS API Configuration"}</span>
          </button>
          <button
            onClick={() => setActiveTab("vercel")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "vercel"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "Vercel Environment Setup" : "Vercel Env Variables"}</span>
          </button>
          <button
            onClick={() => setActiveTab("vps-script")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "vps-script"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "VPS ইনস্টলেশন স্ক্রিপ্ট" : "VPS Server Script"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "connect" && (
            <div className="space-y-4">
              {/* Architecture Notice */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>
                    {lang === "bn"
                      ? "Frontend (Vercel) + Backend/Bot Engine (VPS) সেটআপ"
                      : "Frontend (Vercel) + Backend/Bot Engine (VPS) Setup"}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {lang === "bn"
                    ? "আপনার ফ্রন্টএন্ড ওয়েবসাইট Vercel-এ থাকবে। নিচে আপনার VPS-এর IP/Domain এবং API Secret দিয়ে কানেক্ট টেস্ট করুন। ওয়েবসাইট স্বয়ংক্রিয়ভাবে সব API রিকোয়েস্ট আপনার VPS-এ পাঠাবে।"
                    : "Your website frontend is hosted on Vercel. Enter your VPS IP/Domain and API Secret below to route bot execution, file manager, logs & Docker commands to your VPS."}
                </p>
              </div>

              {/* Input Form */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {lang === "bn" ? "VPS API হোস্ট URL / আইপি এড্রেস" : "VPS API Host URL / Public IP"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="http://194.163.148.91:3000 or https://api.bot-host.xyz"
                      value={vpsUrl}
                      onChange={(e) => setVpsUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === "bn"
                      ? "খালি রাখলে বর্তমান হোস্টেড রিলেটিভ প্রক্সি (/api) ব্যবহার হবে।"
                      : "Leave empty to use default relative endpoint (/api)."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {lang === "bn" ? "VPS API সিক্রেট কি (Security Token)" : "VPS API Secret Key (Optional Security Token)"}
                  </label>
                  <input
                    type="password"
                    placeholder="my_super_secure_vps_token_2026"
                    value={vpsSecret}
                    onChange={(e) => setVpsSecret(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === "bn"
                      ? "আপনার VPS ব্যাকএন্ডকে অননুমোদিত রিকোয়েস্ট থেকে সুরক্ষিত রাখতে টোকেন সেট করতে পারেন।"
                      : "Protects your VPS endpoints from unauthorized access by sending x-vps-api-secret header."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin text-indigo-400" : ""}`} />
                  <span>{testing ? (lang === "bn" ? "টেস্ট হচ্ছে..." : "Testing...") : (lang === "bn" ? "কানেকশন টেস্ট করুন" : "Test Connection & Ping")}</span>
                </button>

                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === "bn" ? "সেটিংস সংরক্ষণ করুন" : "Save Configuration"}</span>
                </button>

                {vpsUrl && (
                  <button
                    onClick={handleResetToDefault}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer ml-auto"
                  >
                    {lang === "bn" ? "রিসেট" : "Reset Default"}
                  </button>
                )}
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                    testResult.success
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                      : "bg-rose-950/30 border-rose-500/30 text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.latency !== undefined && (
                      <span className="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded-md text-slate-300">
                        Latency: {testResult.latency}ms
                      </span>
                    )}
                  </div>

                  {testResult.details?.vpsNode && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                      <div>Node Provider: {testResult.details.vpsNode.provider}</div>
                      <div>Egress IP: {testResult.details.vpsNode.ip}</div>
                      <div>Docker Daemon: {testResult.details.vpsNode.dockerActive ? "ACTIVE (v29.1.3)" : "INACTIVE"}</div>
                      <div>Uptime: {testResult.details.vpsNode.uptime}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "vercel" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Vercel Dashboard Environment Variables</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  আপনার Vercel প্রজেক্টে এই ভ্যারিয়েবলগুলো যোগ করে দিলে স্থায়ীভাবে ওয়েবসাইট আপনার VPS API-এর সাথে সংযুক্ত থাকবে:
                </p>
              </div>

              {/* Env Var 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-indigo-300">VITE_VPS_API_URL</span>
                  <button
                    onClick={() => handleCopy(vpsUrl || "http://YOUR_VPS_IP:3000", "env_url")}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "env_url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-400 bg-black/40 p-2.5 rounded-xl border border-slate-900">
                  {vpsUrl || "http://YOUR_VPS_IP:3000"}
                </div>
              </div>

              {/* Env Var 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-indigo-300">VITE_VPS_API_SECRET</span>
                  <button
                    onClick={() => handleCopy(vpsSecret || "your_secure_vps_token", "env_secret")}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "env_secret" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-400 bg-black/40 p-2.5 rounded-xl border border-slate-900">
                  {vpsSecret || "your_secure_vps_token"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-200 block">Vercel Setup Steps:</span>
                <p>1. Go to your project on Vercel ➔ Settings ➔ Environment Variables</p>
                <p>2. Add <code className="text-indigo-300 font-mono">VITE_VPS_API_URL</code> with value <code className="text-emerald-300 font-mono">http://YOUR_VPS_IP:3000</code></p>
                <p>3. Click "Redeploy" in Vercel to apply changes!</p>
              </div>
            </div>
          )}

          {activeTab === "vps-script" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Ubuntu VPS Setup Command (One-Click)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(sampleUbuntuSetupCmd, "ubuntu_cmd")}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "ubuntu_cmd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Script</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-black/60 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed border border-slate-900">
                  {sampleUbuntuSetupCmd}
                </pre>
              </div>

              {/* Docker Compose config */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Box className="w-4 h-4 text-indigo-400" />
                    <span>docker-compose.yml (Optional Production Container)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(sampleDockerCompose, "docker_compose")}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "docker_compose" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy YAML</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-black/60 font-mono text-[11px] text-sky-300 overflow-x-auto whitespace-pre leading-relaxed border border-slate-900">
                  {sampleDockerCompose}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Target: {vpsUrl ? vpsUrl : "Local/Vercel Proxy (/api)"}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition-colors"
          >
            {lang === "bn" ? "বন্ধ করুন" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
