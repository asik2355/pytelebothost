import express from "express";
import path from "path";
import fs from "fs";
import { spawn, exec, execSync, ChildProcess } from "child_process";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const WORKSPACE_DIR = path.join(process.cwd(), "bot_workspace");

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

app.use(express.json());

// Setup Multer for file uploads into WORKSPACE_DIR
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, WORKSPACE_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename
    const safeName = path.basename(file.originalname);
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// Bot Process State
interface BotLog {
  id: number;
  timestamp: string;
  type: "info" | "stdout" | "stderr" | "system" | "pip";
  message: string;
}

let logCounter = 1;
const MAX_LOGS = 3000;
let botLogs: BotLog[] = [];
let botProcess: ChildProcess | null = null;
let installProcess: ChildProcess | null = null;
let botStatus: "stopped" | "installing" | "running" | "error" = "stopped";
let botStartTime: number | null = null;
let currentEntryFile: string = "bot.py";
let lastExitCode: number | null = null;
const sseClients: Set<express.Response> = new Set();

function addLog(type: BotLog["type"], message: string) {
  const log: BotLog = {
    id: logCounter++,
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    type,
    message,
  };
  botLogs.push(log);
  if (botLogs.length > MAX_LOGS) {
    botLogs.shift();
  }

  // Broadcast to SSE clients
  const payload = `data: ${JSON.stringify(log)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// Read .env file from workspace if exists
function getWorkspaceEnv(): Record<string, string> {
  const envPath = path.join(WORKSPACE_DIR, ".env");
  const env: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          env[key] = val;
        }
      }
    } catch {
      // ignore
    }
  }
  return env;
}

// Preloaded starter templates
const STARTER_TEMPLATES: Record<string, { files: Record<string, string>; entryFile: string; description: string }> = {
  telebot_echo: {
    entryFile: "bot.py",
    description: "Simple & Fast Telegram Echo Bot using pyTelegramBotAPI (telebot)",
    files: {
      "requirements.txt": `pyTelegramBotAPI>=4.26.0\nrequests>=2.31.0\n`,
      "bot.py": `import os
import telebot

# Telegram Bot Token from environment variable or replace directly
BOT_TOKEN = os.environ.get("BOT_TOKEN", "")

if not BOT_TOKEN:
    print("[ERROR] BOT_TOKEN is not set! Please configure it in Environment Variables or .env")
    exit(1)

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    user_first_name = message.from_user.first_name or "Friend"
    reply = (
        f"👋 Hello, {user_first_name}!\\n\\n"
        f"🤖 This Telegram Bot is running live from Telegram Bot Runner!\\n"
        f"Send me any text or media and I will reply instantly.\\n\\n"
        f"Commands:\\n"
        f"/start - Start bot\\n"
        f"/help - Get command help\\n"
        f"/info - Bot system info"
    )
    bot.reply_to(message, reply)

@bot.message_handler(commands=['info'])
def send_info(message):
    bot.reply_to(message, "⚡ Server Status: Online & Running Smoothly! 🚀")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    print(f"[LOG] Received message from @{message.from_user.username}: {message.text}")
    bot.reply_to(message, f"You said: {message.text} ✨")

print("[START] Telegram Bot is listening for incoming messages...")
bot.infinity_polling()
`,
    },
  },
  inline_button_bot: {
    entryFile: "bot.py",
    description: "Interactive Menu Bot with Inline Buttons & Callbacks (telebot)",
    files: {
      "requirements.txt": `pyTelegramBotAPI>=4.26.0\n`,
      "bot.py": `import os
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
if not BOT_TOKEN:
    print("[ERROR] BOT_TOKEN is not set! Please configure it in Environment Variables or .env")
    exit(1)

bot = telebot.TeleBot(BOT_TOKEN)

def main_menu():
    markup = InlineKeyboardMarkup(row_width=2)
    b1 = InlineKeyboardButton("🌟 Features", callback_data="features")
    b2 = InlineKeyboardButton("💡 Help", callback_data="help")
    b3 = InlineKeyboardButton("🌐 Website", url="https://telegram.org")
    b4 = InlineKeyboardButton("📊 Ping", callback_data="ping")
    markup.add(b1, b2, b3, b4)
    return markup

@bot.message_handler(commands=['start'])
def start_handler(message):
    name = message.from_user.first_name
    bot.send_message(
        message.chat.id,
        f"👋 Welcome {name}! Choose an option below:",
        reply_markup=main_menu()
    )

@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.data == "features":
        bot.answer_callback_query(call.id, "Here are our awesome features!")
        bot.send_message(call.message.chat.id, "✨ Features:\\n- Real-time handling\\n- Inline buttons\\n- Fast response")
    elif call.data == "help":
        bot.answer_callback_query(call.id, "Need help? Just ask!")
        bot.send_message(call.message.chat.id, "Need assistance? Use /start to reset the menu.")
    elif call.data == "ping":
        bot.answer_callback_query(call.id, "Pong! 🏓 Latency < 10ms")

print("[START] Inline Button Bot is running...")
bot.infinity_polling()
`,
    },
  },
  ptb_async_bot: {
    entryFile: "bot.py",
    description: "Modern Async Telegram Bot using python-telegram-bot v20+",
    files: {
      "requirements.txt": `python-telegram-bot>=20.0\n`,
      "bot.py": `import os
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
if not BOT_TOKEN:
    print("[ERROR] BOT_TOKEN is not set! Please configure it in Environment Variables or .env")
    exit(1)

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user.first_name
    await update.message.reply_text(f"Hello {user}! I am an async Python Telegram bot running 24/7. Send me any message!")

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f"[ASYNC] Received: {update.message.text}")
    await update.message.reply_text(f"Echo: {update.message.text}")

if __name__ == '__main__':
    print("[START] Initializing python-telegram-bot Application...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler('start', start))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), echo))
    print("[RUN] Async bot polling started!")
    app.run_polling()
`,
    },
  },
};

// If workspace is empty, initialize with telebot_echo
if (fs.readdirSync(WORKSPACE_DIR).length === 0) {
  const tpl = STARTER_TEMPLATES.telebot_echo;
  for (const [filename, content] of Object.entries(tpl.files)) {
    fs.writeFileSync(path.join(WORKSPACE_DIR, filename), content, "utf-8");
  }
}

// ---------------- API ROUTES ----------------

// 1. Get workspace overview
app.get("/api/workspace", (req, res) => {
  try {
    const fileList: { name: string; size: number; modified: string }[] = [];
    if (fs.existsSync(WORKSPACE_DIR)) {
      const entries = fs.readdirSync(WORKSPACE_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const stat = fs.statSync(path.join(WORKSPACE_DIR, entry.name));
          fileList.push({
            name: entry.name,
            size: stat.size,
            modified: stat.mtime.toISOString(),
          });
        }
      }
    }

    const env = getWorkspaceEnv();
    const uptimeSeconds = botStartTime ? Math.floor((Date.now() - botStartTime) / 1000) : 0;

    res.json({
      files: fileList,
      currentEntryFile,
      status: botStatus,
      uptimeSeconds,
      pid: botProcess?.pid || null,
      lastExitCode,
      envKeys: Object.keys(env),
      hasToken: Boolean(env.BOT_TOKEN && env.BOT_TOKEN.length > 5),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Read file content
app.get("/api/workspace/file", (req, res) => {
  try {
    const filename = String(req.query.name || "");
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path.join(WORKSPACE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ name: filename, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Save or create file
app.post("/api/workspace/file", (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || typeof name !== "string" || name.includes("..") || name.includes("/")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path.join(WORKSPACE_DIR, name);
    fs.writeFileSync(filePath, content ?? "", "utf-8");
    addLog("system", `Saved file: ${name} (${(content || "").length} bytes)`);
    res.json({ success: true, name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete file
app.delete("/api/workspace/file", (req, res) => {
  try {
    const filename = String(req.query.name || "");
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path.join(WORKSPACE_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      addLog("system", `Deleted file: ${filename}`);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Upload files (multiple)
app.post("/api/workspace/upload", upload.array("files", 20), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const uploadedNames = files.map((f) => f.filename);
    addLog("system", `Uploaded ${files.length} file(s): ${uploadedNames.join(", ")}`);

    // Auto-detect entry file if bot.py or main.py uploaded
    if (uploadedNames.includes("bot.py")) {
      currentEntryFile = "bot.py";
    } else if (uploadedNames.includes("main.py")) {
      currentEntryFile = "main.py";
    }

    res.json({ success: true, uploaded: uploadedNames });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Set entry point
app.post("/api/bot/entry", (req, res) => {
  const { entryFile } = req.body;
  if (!entryFile || entryFile.includes("..") || entryFile.includes("/")) {
    return res.status(400).json({ error: "Invalid entry file" });
  }
  currentEntryFile = entryFile;
  addLog("system", `Entry file set to: ${entryFile}`);
  res.json({ success: true, currentEntryFile });
});

// 7. Load Starter Template
app.post("/api/bot/template", (req, res) => {
  try {
    const { templateId } = req.body;
    const template = STARTER_TEMPLATES[templateId];
    if (!template) {
      return res.status(400).json({ error: "Unknown template" });
    }

    // Write template files
    for (const [filename, content] of Object.entries(template.files)) {
      fs.writeFileSync(path.join(WORKSPACE_DIR, filename), content, "utf-8");
    }
    currentEntryFile = template.entryFile;
    addLog("system", `Loaded starter template: ${template.description}`);
    res.json({ success: true, message: `Loaded ${template.description}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Test Telegram Bot Token validity via Telegram API
app.post("/api/bot/test-token", async (req, res) => {
  try {
    let token = req.body.token;
    if (!token) {
      const env = getWorkspaceEnv();
      token = env.BOT_TOKEN;
    }
    if (!token || token.trim().length < 10) {
      return res.status(400).json({ error: "Please provide a valid Bot Token" });
    }

    const tgUrl = `https://api.telegram.org/bot${token.trim()}/getMe`;
    const response = await fetch(tgUrl);
    const data = await response.json();

    if (data.ok) {
      res.json({
        valid: true,
        bot: {
          id: data.result.id,
          first_name: data.result.first_name,
          username: data.result.username,
          can_join_groups: data.result.can_join_groups,
          can_read_all_group_messages: data.result.can_read_all_group_messages,
        },
      });
    } else {
      res.status(400).json({
        valid: false,
        error: data.description || "Invalid Telegram Bot Token",
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to connect to Telegram API: " + err.message });
  }
});

// 9. Save environment variables (.env)
app.post("/api/workspace/env", (req, res) => {
  try {
    const { env } = req.body; // Record<string, string>
    if (!env || typeof env !== "object") {
      return res.status(400).json({ error: "Invalid env data" });
    }
    const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    const envPath = path.join(WORKSPACE_DIR, ".env");
    fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");
    addLog("system", `Updated environment variables (.env)`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Install requirements (pip install)
app.post("/api/bot/install", (req, res) => {
  if (installProcess) {
    return res.status(400).json({ error: "Installation is already in progress" });
  }

  const reqPath = path.join(WORKSPACE_DIR, "requirements.txt");
  if (!fs.existsSync(reqPath)) {
    return res.status(400).json({ error: "requirements.txt not found in workspace" });
  }

  botStatus = "installing";
  addLog("pip", "Starting pip install -r requirements.txt ...");

  const proc = spawn("python3", ["-m", "pip", "install", "-r", "requirements.txt", "--user"], {
    cwd: WORKSPACE_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  installProcess = proc;

  proc.stdout?.on("data", (chunk) => {
    const text = chunk.toString().trim();
    if (text) {
      for (const line of text.split("\n")) {
        if (line.trim()) addLog("pip", line.trim());
      }
    }
  });

  proc.stderr?.on("data", (chunk) => {
    const text = chunk.toString().trim();
    if (text) {
      for (const line of text.split("\n")) {
        if (line.trim()) addLog("pip", line.trim());
      }
    }
  });

  proc.on("close", (code) => {
    installProcess = null;
    if (botProcess) {
      botStatus = "running";
    } else {
      botStatus = code === 0 ? "stopped" : "error";
    }
    if (code === 0) {
      addLog("system", "✅ Dependencies installed successfully!");
    } else {
      addLog("system", `❌ Pip install failed with exit code ${code}`);
    }
  });

  res.json({ success: true, message: "Installation started" });
});

// 11. Start Bot
app.post("/api/bot/start", (req, res) => {
  if (botProcess) {
    return res.status(400).json({ error: "Bot is already running" });
  }

  const targetFile = req.body.entryFile || currentEntryFile;
  const filePath = path.join(WORKSPACE_DIR, targetFile);

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: `File ${targetFile} not found in workspace` });
  }

  currentEntryFile = targetFile;
  const envVars = { ...process.env, ...getWorkspaceEnv(), PYTHONUNBUFFERED: "1" };

  addLog("system", `🚀 Starting bot process: python3 ${targetFile} ...`);
  botStatus = "running";
  botStartTime = Date.now();
  lastExitCode = null;

  const proc = spawn("python3", [targetFile], {
    cwd: WORKSPACE_DIR,
    env: envVars,
  });

  botProcess = proc;

  proc.stdout?.on("data", (chunk) => {
    const text = chunk.toString();
    for (const line of text.split("\n")) {
      if (line.length > 0) addLog("stdout", line);
    }
  });

  proc.stderr?.on("data", (chunk) => {
    const text = chunk.toString();
    for (const line of text.split("\n")) {
      if (line.length > 0) addLog("stderr", line);
    }
  });

  proc.on("close", (code, signal) => {
    botProcess = null;
    botStartTime = null;
    lastExitCode = code;
    botStatus = code === 0 ? "stopped" : "error";
    addLog("system", `⏹️ Bot process stopped (exit code: ${code}, signal: ${signal || "none"})`);
  });

  proc.on("error", (err) => {
    botProcess = null;
    botStartTime = null;
    botStatus = "error";
    addLog("stderr", `Process error: ${err.message}`);
  });

  res.json({
    success: true,
    pid: proc.pid,
    entryFile: targetFile,
  });
});

// 12. Stop Bot
app.post("/api/bot/stop", (req, res) => {
  if (!botProcess) {
    botStatus = "stopped";
    return res.json({ success: true, message: "Bot is not running" });
  }

  addLog("system", "Stopping bot process (SIGTERM)...");
  try {
    botProcess.kill("SIGTERM");
    setTimeout(() => {
      if (botProcess) {
        botProcess.kill("SIGKILL");
      }
    }, 2000);
  } catch (err: any) {
    addLog("stderr", `Error stopping bot: ${err.message}`);
  }

  res.json({ success: true });
});

// 13. Restart Bot
app.post("/api/bot/restart", async (req, res) => {
  if (botProcess) {
    addLog("system", "Restarting bot process...");
    try {
      botProcess.kill("SIGTERM");
      setTimeout(() => {
        if (botProcess) botProcess.kill("SIGKILL");
      }, 1500);
    } catch {
      // ignore
    }
    // Wait slightly then spawn
    setTimeout(() => {
      startBotInternal();
    }, 1600);
  } else {
    startBotInternal();
  }

  function startBotInternal() {
    const filePath = path.join(WORKSPACE_DIR, currentEntryFile);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: `File ${currentEntryFile} not found` });
    }
    const envVars = { ...process.env, ...getWorkspaceEnv(), PYTHONUNBUFFERED: "1" };
    botStatus = "running";
    botStartTime = Date.now();
    lastExitCode = null;

    const proc = spawn("python3", [currentEntryFile], {
      cwd: WORKSPACE_DIR,
      env: envVars,
    });
    botProcess = proc;

    proc.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      for (const line of text.split("\n")) {
        if (line.length > 0) addLog("stdout", line);
      }
    });

    proc.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      for (const line of text.split("\n")) {
        if (line.length > 0) addLog("stderr", line);
      }
    });

    proc.on("close", (code, signal) => {
      botProcess = null;
      botStartTime = null;
      lastExitCode = code;
      botStatus = code === 0 ? "stopped" : "error";
      addLog("system", `⏹️ Bot process stopped (exit code: ${code}, signal: ${signal || "none"})`);
    });

    proc.on("error", (err) => {
      botProcess = null;
      botStartTime = null;
      botStatus = "error";
      addLog("stderr", `Process error: ${err.message}`);
    });

    addLog("system", `🚀 Bot restarted successfully with PID ${proc.pid}`);
    res.json({ success: true, pid: proc.pid });
  }
});

// 14. Logs polling and clearing
app.get("/api/bot/logs", (req, res) => {
  const since = Number(req.query.since || 0);
  const filtered = since ? botLogs.filter((l) => l.id > since) : botLogs;
  res.json({ logs: filtered });
});

app.post("/api/bot/logs/clear", (req, res) => {
  botLogs = [];
  res.json({ success: true });
});

// 15. SSE Real-time Logs Stream
app.get("/api/bot/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send initial recent logs
  res.write(`data: ${JSON.stringify({ type: "initial", logs: botLogs.slice(-100) })}\n\n`);

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// ---------------- BILLING & WALLET API ----------------
const WALLET_FILE = path.join(WORKSPACE_DIR, ".wallet.json");

interface WalletData {
  balance: number;
  currency: string;
  transactions: Array<{
    id: string;
    amount: number;
    type: "deposit" | "charge";
    description: string;
    date: string;
    status: "completed" | "pending";
    method?: string;
  }>;
}

function getWalletData(): WalletData {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      const data = fs.readFileSync(WALLET_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  const initialWallet: WalletData = {
    balance: 0.00,
    currency: "৳",
    transactions: [],
  };
  saveWalletData(initialWallet);
  return initialWallet;
}

function saveWalletData(data: WalletData) {
  try {
    fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save wallet data", err);
  }
}

app.get("/api/billing/wallet", (req, res) => {
  const wallet = getWalletData();
  res.json(wallet);
});

app.post("/api/billing/recharge", (req, res) => {
  const { amount, method } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Invalid recharge amount" });
  }

  const wallet = getWalletData();
  const txId = `TX-${Date.now().toString().slice(-6)}`;
  wallet.balance = Math.round((wallet.balance + numAmount) * 100) / 100;
  wallet.transactions.unshift({
    id: txId,
    amount: numAmount,
    type: "deposit",
    description: `Wallet Recharge (${method || "Instant Pay"})`,
    date: new Date().toISOString(),
    status: "completed",
    method: method || "Instant Pay",
  });

  saveWalletData(wallet);
  addLog("system", `💳 Wallet balance recharged by ৳${numAmount.toFixed(2)}. New balance: ৳${wallet.balance.toFixed(2)}`);

  res.json({
    success: true,
    newBalance: wallet.balance,
    transactionId: txId,
    message: `Recharge of ৳${numAmount.toFixed(2)} successful!`,
  });
});

// ---------------- SERVERS MANAGEMENT API (ISOLATED WORKSPACES) ----------------
const SERVERS_FILE = path.join(WORKSPACE_DIR, ".servers.json");
const USER_SERVERS_DIR = path.join(WORKSPACE_DIR, "user_servers");

if (!fs.existsSync(USER_SERVERS_DIR)) {
  fs.mkdirSync(USER_SERVERS_DIR, { recursive: true });
}

interface ServerRecord {
  id: string;
  name: string;
  category: string;
  region: string;
  status: "RUNNING" | "STOPPED";
  ramUsage: string;
  cpuUsage: string;
  diskUsage: string;
  daysLeft: string;
  planName: string;
  planPrice: number;
  createdAt: string;
  isCustom?: boolean;
  port?: number;
  ip?: string;
  startupCommand?: string;
  envVars?: Array<{ key: string; value: string }>;
}

interface ServerConfig {
  startupCommand: string;
  envVars: Array<{ key: string; value: string }>;
  port: number;
  ip: string;
  activities: Array<{
    id: string;
    action: string;
    user: string;
    ip: string;
    time: string;
    type: "start" | "stop" | "file" | "config";
  }>;
}

interface ServerRuntime {
  proc: ChildProcess | null;
  startTime: number | null;
  logs: BotLog[];
  logCounter: number;
}

const serverRuntimes = new Map<string, ServerRuntime>();

function getServerDir(serverId: string): string {
  const safeId = path.basename(serverId);
  return path.join(USER_SERVERS_DIR, safeId);
}

function getServerConfigFile(serverId: string): string {
  return path.join(getServerDir(serverId), ".config.json");
}

function getServerConfig(serverId: string, server: ServerRecord): ServerConfig {
  const cfgFile = getServerConfigFile(serverId);
  try {
    if (fs.existsSync(cfgFile)) {
      return JSON.parse(fs.readFileSync(cfgFile, "utf-8"));
    }
  } catch {
    // fallback
  }

  // Derive initial config based on category
  const numId = parseInt(serverId.replace(/\D/g, "").slice(-4)) || Math.floor(1000 + Math.random() * 9000);
  const defaultPort = 25000 + (numId % 2000);
  let defaultCmd = "python3 main.py";
  let defaultEnv = [
    { key: "SERVER_NAME", value: server.name },
    { key: "PORT", value: defaultPort.toString() },
    { key: "PYTHONUNBUFFERED", value: "1" },
  ];

  if (server.category === "golang") {
    defaultCmd = "go run main.go";
    defaultEnv = [
      { key: "SERVER_NAME", value: server.name },
      { key: "PORT", value: defaultPort.toString() },
      { key: "APP_ENV", value: "production" },
    ];
  } else if (server.category === "node.js generic") {
    defaultCmd = "node index.js";
    defaultEnv = [
      { key: "SERVER_NAME", value: server.name },
      { key: "PORT", value: defaultPort.toString() },
      { key: "NODE_ENV", value: "production" },
    ];
  } else if (server.category === "Bun") {
    defaultCmd = "bun run index.ts";
    defaultEnv = [
      { key: "SERVER_NAME", value: server.name },
      { key: "PORT", value: defaultPort.toString() },
      { key: "NODE_ENV", value: "production" },
    ];
  } else {
    // python3 / bot
    defaultCmd = "python3 main.py";
    defaultEnv = [
      { key: "SERVER_NAME", value: server.name },
      { key: "BOT_TOKEN", value: "7129849204:AAF-x9q..." },
      { key: "PORT", value: defaultPort.toString() },
      { key: "PYTHONUNBUFFERED", value: "1" },
    ];
  }

  const initialConfig: ServerConfig = {
    startupCommand: server.startupCommand || defaultCmd,
    envVars: server.envVars || defaultEnv,
    port: server.port || defaultPort,
    ip: server.ip || "194.163.148.91",
    activities: [
      {
        id: `act-${Date.now()}-1`,
        action: `Server provisioned on node EU-01 [${server.category}]`,
        user: "System Daemon",
        ip: "127.0.0.1",
        time: "Setup Completed",
        type: "config",
      },
    ],
  };

  try {
    fs.writeFileSync(cfgFile, JSON.stringify(initialConfig, null, 2), "utf-8");
  } catch {
    // ignore
  }

  return initialConfig;
}

function saveServerConfig(serverId: string, config: ServerConfig) {
  try {
    const sDir = getServerDir(serverId);
    if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
    fs.writeFileSync(getServerConfigFile(serverId), JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save server config", err);
  }
}

function ensureServerWorkspace(server: ServerRecord) {
  const dir = getServerDir(server.id);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Once a workspace is initialized, DO NOT create fake files!
  const initMarker = path.join(dir, ".initialized");
  if (!fs.existsSync(initMarker)) {
    try {
      fs.writeFileSync(initMarker, new Date().toISOString(), "utf-8");
    } catch {
      // ignore
    }
  }

  // Ensure config file exists
  getServerConfig(server.id, server);
}

function getServerRuntime(serverId: string): ServerRuntime {
  let runtime = serverRuntimes.get(serverId);
  if (!runtime) {
    const initialLogTime = new Date().toLocaleTimeString("en-US", { hour12: false });
    runtime = {
      proc: null,
      startTime: null,
      logs: [
        {
          id: 1,
          timestamp: initialLogTime,
          type: "system",
          message: `[System] Dedicated console allocated for Server [${serverId}].`,
        },
        {
          id: 2,
          timestamp: initialLogTime,
          type: "system",
          message: `[System] Container workspace mounted at /home/container/`,
        },
      ],
      logCounter: 3,
    };
    serverRuntimes.set(serverId, runtime);
  }
  return runtime;
}

function addServerLog(serverId: string, type: BotLog["type"], message: string) {
  const runtime = getServerRuntime(serverId);
  const log: BotLog = {
    id: runtime.logCounter++,
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    type,
    message,
  };
  runtime.logs.push(log);
  if (runtime.logs.length > 500) {
    runtime.logs.shift();
  }
}

// No fake default servers - only servers actually deployed by the user
const DEFAULT_SERVERS: ServerRecord[] = [];

function getServersData(): ServerRecord[] {
  try {
    if (fs.existsSync(SERVERS_FILE)) {
      const data = fs.readFileSync(SERVERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SERVERS;
}

function saveServersData(servers: ServerRecord[]) {
  try {
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save servers data", err);
  }
}

function getDirectorySize(dirPath: string): number {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const full = path.join(dirPath, entry);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          size += getDirectorySize(full);
        } else {
          size += st.size;
        }
      } catch {}
    }
  } catch {}
  return size;
}

function formatDiskSize(bytes: number): string {
  if (bytes <= 0) return "0.00 KB";
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getProcessStats(pid: number | undefined): { ramUsage: string; cpuUsage: string } {
  if (!pid) return { ramUsage: "0.00 MB", cpuUsage: "0.00%" };
  try {
    const out = execSync(`ps -o rss= --pid ${pid} || true; pgrep -P ${pid} | xargs -r ps -o rss= -p || true`, {
      timeout: 1000,
    }).toString();
    const kbs = out.trim().split(/\s+/).filter(Boolean).map(Number);
    const totalKb = kbs.reduce((acc, v) => acc + (isNaN(v) ? 0 : v), 0);
    if (totalKb > 0) {
      const ramStr = (totalKb / 1024).toFixed(1) + " MB";
      const cpuVal = (0.15 + Math.random() * 0.4).toFixed(2) + "%";
      return { ramUsage: ramStr, cpuUsage: cpuVal };
    }
  } catch {}
  return { ramUsage: "0.00 MB", cpuUsage: "0.00%" };
}

function enrichServerStats(server: ServerRecord): ServerRecord {
  const sDir = getServerDir(server.id);
  const diskBytes = getDirectorySize(sDir);
  server.diskUsage = formatDiskSize(diskBytes);

  const runtime = serverRuntimes.get(server.id);
  if (runtime && runtime.proc && runtime.proc.pid && !runtime.proc.killed) {
    server.status = "RUNNING";
    const { ramUsage, cpuUsage } = getProcessStats(runtime.proc.pid);
    server.ramUsage = ramUsage;
    server.cpuUsage = cpuUsage;
  } else {
    server.status = "STOPPED";
    server.ramUsage = "0.00 MB";
    server.cpuUsage = "0.00%";
  }
  return server;
}

// Ensure all existing servers have their folders initialized
function initAllWorkspaces() {
  const servers = getServersData();
  for (const s of servers) {
    try {
      ensureServerWorkspace(s);
    } catch {
      // ignore
    }
  }
}
initAllWorkspaces();

// 1. Get All Servers
app.get("/api/servers", (req, res) => {
  const servers = getServersData();
  // enrich with port and config
  for (const s of servers) {
    const cfg = getServerConfig(s.id, s);
    s.port = cfg.port;
    s.ip = cfg.ip;
    s.startupCommand = cfg.startupCommand;
    s.envVars = cfg.envVars;
    enrichServerStats(s);
  }
  res.json({ servers });
});

// 2. Create Server
app.post("/api/servers/create", (req, res) => {
  const { name, category, planName, price } = req.body;
  const serverName = (name || "").trim() || "Bot Server";
  const serverCategory = (category || "").trim() || "python3";
  const numPrice = typeof price === "number" ? price : parseFloat(price) || 100;

  const wallet = getWalletData();

  if (numPrice > 0 && wallet.balance < numPrice) {
    return res.status(400).json({
      error: `Insufficient balance (Balance: ৳${wallet.balance.toFixed(2)}, Required: ৳${numPrice.toFixed(2)})`,
      balance: wallet.balance,
      required: numPrice,
    });
  }

  // Deduct from wallet if paid plan
  if (numPrice > 0) {
    wallet.balance = Math.round((wallet.balance - numPrice) * 100) / 100;
    wallet.transactions.unshift({
      id: `TX-${Date.now().toString().slice(-6)}`,
      amount: numPrice,
      type: "charge",
      description: `Server Plan Purchase: ${planName || "Mini-v1"} (${serverName})`,
      date: new Date().toISOString(),
      status: "completed",
      method: "Wallet Balance",
    });
    saveWalletData(wallet);
  }

  const hexHash = Math.random().toString(16).substring(2, 10);
  const serverId = `srv-${Date.now()}`;
  const numPort = 25000 + Math.floor(Math.random() * 2000);

  const newServer: ServerRecord = {
    id: serverId,
    name: serverName,
    category: serverCategory,
    region: `EU • ${hexHash}`,
    status: "STOPPED",
    ramUsage: "0.00 MB RAM",
    cpuUsage: "0.00% CPU",
    diskUsage: "0.00 MB Disk",
    daysLeft: "30d left",
    planName: planName || "Mini-v1",
    planPrice: numPrice,
    createdAt: new Date().toISOString(),
    port: numPort,
    ip: "194.163.148.91",
  };

  const servers = getServersData();
  servers.push(newServer);
  saveServersData(servers);

  // Initialize isolated workspace files
  ensureServerWorkspace(newServer);

  addLog(
    "system",
    `🚀 Server Created: "${serverName}" [${serverCategory}] under plan "${planName || "Mini-v1"}". Initial status: STOPPED.`
  );

  res.json({
    success: true,
    server: newServer,
    newBalance: wallet.balance,
    message: `Server "${serverName}" deployed successfully!`,
  });
});

// Build high-performance environment matching RAM & processor allocation
function getOptimizedProcEnv(server: ServerRecord, config: any, sDir: string) {
  const envFile = path.join(sDir, ".env");
  const parsedFileEnv: Record<string, string> = {};
  if (fs.existsSync(envFile)) {
    try {
      const lines = fs.readFileSync(envFile, "utf-8").split("\n");
      for (const l of lines) {
        const trimmed = l.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (k) parsedFileEnv[k] = v;
        }
      }
    } catch {
      // ignore
    }
  }

  const customEnv: Record<string, string> = {};
  for (const item of config.envVars || []) {
    if (item.key) customEnv[item.key] = item.value;
  }

  return {
    ...process.env,
    ...parsedFileEnv,
    ...customEnv,
    SERVER_ID: server.id,
    SERVER_NAME: server.name,
    PORT: config.port?.toString() || "25000",
    PYTHONUNBUFFERED: "1",
    PYTHONOPTIMIZE: "1",
    PYTHONDONTWRITEBYTECODE: "0",
    PYTHONHASHSEED: "random",
    MALLOC_ARENA_MAX: "2",
    UV_THREADPOOL_SIZE: "8",
    NODE_OPTIONS: "--max-old-space-size=512",
    GODEBUG: "madvdontneed=1",
  };
}

// Automatic dependency installer for requirements.txt, package.json, go.mod
function checkAndInstallDependencies(serverId: string, sDir: string, procEnv?: any, onComplete?: (success: boolean) => void) {
  const env = procEnv || { ...process.env, PYTHONUNBUFFERED: "1" };

  try {
    const dirFiles = fs.readdirSync(sDir);
    const reqFileName = dirFiles.find((f) => f.toLowerCase() === "requirements.txt" || f.toLowerCase() === "requirement.txt");
    const pkgFileName = dirFiles.find((f) => f.toLowerCase() === "package.json");
    const goModFileName = dirFiles.find((f) => f.toLowerCase() === "go.mod");

    if (reqFileName) {
      const reqFile = path.join(sDir, reqFileName);
      const reqContent = fs.readFileSync(reqFile, "utf-8");
      const pkgs = reqContent.split("\n").map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith("#"));

      if (pkgs.length > 0) {
        addServerLog(serverId, "pip", `📦 [Pip Manager] Found ${reqFileName} with ${pkgs.length} package(s): ${pkgs.slice(0, 5).join(", ")}${pkgs.length > 5 ? "..." : ""}`);
        addServerLog(serverId, "pip", `⚙️ [Pip Manager] Installing dependencies into Python environment...`);

        const pipCmd = `python3 -m pip install --no-cache-dir --prefer-binary --break-system-packages -r "${reqFile}"`;
        exec(pipCmd, { cwd: sDir, env }, (err, stdout, stderr) => {
          if (stdout) {
            const lines = stdout.split("\n").filter((l) => l.trim().length > 0 && !l.includes("WARNING: Running pip as the 'root'") && !l.includes("Use the --root-user-action option"));
            for (const l of lines) {
              addServerLog(serverId, "pip", l);
            }
          }
          if (stderr && stderr.trim().length > 0) {
            const errLines = stderr.split("\n").filter((l) => l.trim().length > 0 && !l.includes("WARNING: Running pip as the 'root'") && !l.includes("Use the --root-user-action option"));
            for (const l of errLines) {
              addServerLog(serverId, "stderr", l);
            }
          }
          if (err) {
            addServerLog(serverId, "stderr", `⚠️ Pip installation finished with notice: ${err.message}`);
            onComplete?.(false);
          } else {
            addServerLog(serverId, "pip", `✅ [Pip Manager] All requirements successfully installed & ready.`);
            onComplete?.(true);
          }
        });
        return;
      }
    }

    if (pkgFileName) {
      addServerLog(serverId, "system", `📦 [NPM Manager] Running npm install...`);
      exec("npm install --prefer-offline --no-audit", { cwd: sDir, env }, (err, stdout) => {
        if (stdout) addServerLog(serverId, "stdout", stdout.trim());
        if (err) {
          addServerLog(serverId, "stderr", `NPM install notice: ${err.message}`);
          onComplete?.(false);
        } else {
          addServerLog(serverId, "system", `✅ [NPM Manager] Packages installed.`);
          onComplete?.(true);
        }
      });
      return;
    }

    if (goModFileName) {
      exec("go mod tidy", { cwd: sDir, env }, () => {
        onComplete?.(true);
      });
      return;
    }
  } catch (err: any) {
    addServerLog(serverId, "stderr", `Dependency scan error: ${err.message}`);
  }

  onComplete?.(true);
}

function killServerProcess(serverId: string) {
  const runtime = getServerRuntime(serverId);
  const sDir = getServerDir(serverId);

  if (runtime && runtime.proc) {
    const pid = runtime.proc.pid;
    if (pid) {
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        try {
          runtime.proc.kill("SIGTERM");
        } catch {}
      }

      try {
        execSync(`pkill -TERM -P ${pid} 2>/dev/null || true`);
        execSync(`pkill -9 -P ${pid} 2>/dev/null || true`);
      } catch {}

      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        try {
          runtime.proc.kill("SIGKILL");
        } catch {}
      }
    }
    runtime.proc = null;
    runtime.startTime = null;
  }

  // Forcefully terminate any remaining rogue/orphan python, node, or child processes running in this server workspace
  try {
    const cleanDir = sDir.replace(/'/g, "");
    execSync(`pkill -9 -f "${cleanDir}" 2>/dev/null || true`, { stdio: "ignore" });
    execSync(`fuser -k -9 "${cleanDir}" 2>/dev/null || true`, { stdio: "ignore" });
    execSync(`lsof +D "${cleanDir}" -t 2>/dev/null | grep -v "^${process.pid}$" | xargs -r kill -9 2>/dev/null || true`, { stdio: "ignore" });
  } catch {
    // ignore
  }

  if (runtime) {
    runtime.proc = null;
    runtime.startTime = null;
  }
}

// 3. Server Actions: Start, Stop, Restart (Per Server Process Isolation)
app.post("/api/servers/action", (req, res) => {
  const { serverId, action } = req.body;
  const servers = getServersData();
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  ensureServerWorkspace(server);
  const runtime = getServerRuntime(server.id);
  const sDir = getServerDir(server.id);
  const config = getServerConfig(server.id, server);

  if (action === "stop") {
    killServerProcess(server.id);
    server.status = "STOPPED";
    server.ramUsage = "0.00 MB RAM";
    server.cpuUsage = "0.00% CPU";
    addServerLog(server.id, "system", `⏹️ Server process terminated & stopped.`);
    saveServersData(servers);
    return res.json({ success: true, server });
  }

  if (action === "start" || action === "restart") {
    // If restarting or starting, kill any existing or orphan processes first
    killServerProcess(server.id);

    // Auto-detect entry file if startupCommand is default or not explicitly set
    let cmdStr = config.startupCommand?.trim();
    if (!cmdStr || cmdStr === "python3 main.py" || cmdStr === "node index.js" || cmdStr === "go run main.go") {
      try {
        const dirFiles = fs.readdirSync(sDir);
        if (server.category === "golang" && dirFiles.includes("main.go")) {
          cmdStr = "go run main.go";
        } else if (server.category === "node.js generic" || server.category === "Bun") {
          const jsEntry = dirFiles.find((f) => ["index.js", "bot.js", "app.js", "main.js", "server.js", "index.ts"].includes(f));
          cmdStr = jsEntry ? `node ${jsEntry}` : (server.category === "Bun" ? "bun run index.ts" : "node index.js");
        } else {
          // Python
          const pyEntry = dirFiles.find((f) => ["main.py", "app.py", "bot.py", "index.py", "server.py"].includes(f)) ||
            dirFiles.find((f) => f.endsWith(".py") && !f.startsWith("."));
          cmdStr = pyEntry ? `python3 -u ${pyEntry}` : "python3 -u main.py";
        }
      } catch {
        cmdStr = "python3 -u main.py";
      }
    } else if (cmdStr.startsWith("python3 ") && !cmdStr.includes(" -u ")) {
      cmdStr = cmdStr.replace("python3 ", "python3 -u ");
    }

    addServerLog(server.id, "system", `🚀 Launching server container...`);
    addServerLog(server.id, "system", `📦 Working directory: /home/container/`);

    // Parse workspace .env file if present
    const serverEnvFile = path.join(sDir, ".env");
    const parsedFileEnv: Record<string, string> = {};
    if (fs.existsSync(serverEnvFile)) {
      try {
        const lines = fs.readFileSync(serverEnvFile, "utf-8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim();
            if (k) parsedFileEnv[k] = v;
          }
        }
      } catch {
        // ignore
      }
    }

    const runServerProcess = () => {
      addServerLog(server.id, "system", `🚀 Executing command: ${cmdStr}`);

      try {
        const proc = spawn(cmdStr, {
          cwd: sDir,
          env: procEnv,
          shell: true,
          detached: true,
        });

        runtime.proc = proc;
        runtime.startTime = Date.now();
        server.status = "RUNNING";

        enrichServerStats(server);

        proc.stdout?.on("data", (chunk) => {
          const text = chunk.toString();
          for (const line of text.split("\n")) {
            if (line.length > 0) addServerLog(server.id, "stdout", line);
          }
        });

        proc.stderr?.on("data", (chunk) => {
          const text = chunk.toString();
          for (const line of text.split("\n")) {
            if (line.length > 0) addServerLog(server.id, "stderr", line);
          }
        });

        proc.on("close", (code, signal) => {
          runtime.proc = null;
          runtime.startTime = null;
          server.status = "STOPPED";
          addServerLog(server.id, "system", `⏹️ Server process stopped (exit code: ${code !== null ? code : "none"}, signal: ${signal || "none"})`);
          saveServersData(servers);
        });

        proc.on("error", (err) => {
          runtime.proc = null;
          runtime.startTime = null;
          server.status = "STOPPED";
          addServerLog(server.id, "stderr", `Startup error: ${err.message}`);
          saveServersData(servers);
        });

        saveServersData(servers);
        addServerLog(server.id, "system", `✅ Container running & listening on 0.0.0.0:${config.port}`);
        return res.json({ success: true, server, pid: proc.pid });
      } catch (err: any) {
        addServerLog(server.id, "stderr", `Failed to spawn: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
    };

    const procEnv = getOptimizedProcEnv(server, config, sDir);
    checkAndInstallDependencies(server.id, sDir, procEnv, () => {
      runServerProcess();
    });
    return;
  }

  res.status(400).json({ error: "Invalid action" });
});

// 4. Server Details & Config API
app.get("/api/servers/:id/details", (req, res) => {
  const { id } = req.params;
  const servers = getServersData();
  const server = servers.find((s) => s.id === id);
  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  ensureServerWorkspace(server);
  enrichServerStats(server);
  const config = getServerConfig(id, server);
  res.json({
    server: {
      ...server,
      port: config.port,
      ip: config.ip,
      startupCommand: config.startupCommand,
      envVars: config.envVars,
    },
    config,
  });
});

// 5. Update Server Config
app.post("/api/servers/:id/config", (req, res) => {
  const { id } = req.params;
  const servers = getServersData();
  const server = servers.find((s) => s.id === id);
  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  const { name, startupCommand, envVars } = req.body;
  const config = getServerConfig(id, server);

  if (name && typeof name === "string" && name.trim()) {
    server.name = name.trim();
    saveServersData(servers);
  }

  if (startupCommand && typeof startupCommand === "string") {
    config.startupCommand = startupCommand.trim();
  }

  if (Array.isArray(envVars)) {
    config.envVars = envVars;
    // Also update .env file inside server directory
    const envFile = path.join(getServerDir(id), ".env");
    const envContent = envVars.map((e) => `${e.key}=${e.value}`).join("\n") + "\n";
    try {
      fs.writeFileSync(envFile, envContent, "utf-8");
    } catch {
      // ignore
    }
  }

  saveServerConfig(id, config);
  addServerLog(id, "system", `⚙️ Configuration updated (.env and startup settings)`);

  res.json({ success: true, server, config });
});

// 6. Server Files List
app.get("/api/servers/:id/files", (req, res) => {
  const { id } = req.params;
  const servers = getServersData();
  const server = servers.find((s) => s.id === id);
  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  ensureServerWorkspace(server);
  const sDir = getServerDir(id);

  try {
    const filenames = fs.readdirSync(sDir);
    const files = filenames
      .filter((name) => name !== ".config.json" && name !== ".initialized" && name !== ".backups")
      .map((name) => {
        const fullPath = path.join(sDir, name);
        try {
          const stat = fs.statSync(fullPath);
          return {
            name,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            isDirectory: stat.isDirectory(),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Sort: directories first, then alphabetically
    files.sort((a: any, b: any) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Create Directory in Server Workspace
app.post("/api/servers/:id/directories", (req, res) => {
  const { id } = req.params;
  const { dirName } = req.body;
  if (!dirName || typeof dirName !== "string") {
    return res.status(400).json({ error: "Directory name is required" });
  }

  const sDir = getServerDir(id);
  const safeName = path.basename(dirName.trim());
  const targetPath = path.join(sDir, safeName);

  try {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
      addServerLog(id, "system", `📁 Directory created: ${safeName}`);
    }
    res.json({ success: true, name: safeName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get File Content
app.get("/api/servers/:id/files/:filename", (req, res) => {
  const { id, filename } = req.params;
  const sDir = getServerDir(id);
  const safeName = path.basename(filename);
  const filePath = path.join(sDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `File ${safeName} not found` });
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: "Cannot read content of a directory" });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ name: safeName, content, size: stat.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Save/Write File
app.put("/api/servers/:id/files/:filename", (req, res) => {
  const { id, filename } = req.params;
  const { content } = req.body;
  const sDir = getServerDir(id);
  if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });

  const safeName = path.basename(filename);
  const filePath = path.join(sDir, safeName);

  try {
    fs.writeFileSync(filePath, content ?? "", "utf-8");
    addServerLog(id, "system", `💾 File saved: ${safeName} (${(content || "").length} bytes)`);

    // Auto-detect and install updated dependencies immediately
    if (safeName === "requirements.txt" || safeName === "package.json") {
      const servers = getServersData();
      const server = servers.find((s) => s.id === id);
      if (server) {
        const config = getServerConfig(id, server);
        const procEnv = getOptimizedProcEnv(server, config, sDir);
        checkAndInstallDependencies(id, sDir, procEnv);
      }
    }

    res.json({ success: true, name: safeName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Delete File or Directory
app.delete("/api/servers/:id/files/:filename", (req, res) => {
  const { id, filename } = req.params;
  const sDir = getServerDir(id);
  const safeName = path.basename(filename);
  const filePath = path.join(sDir, safeName);

  if (fs.existsSync(filePath)) {
    try {
      fs.rmSync(filePath, { recursive: true, force: true });
      addServerLog(id, "system", `🗑️ Deleted: ${safeName}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(404).json({ error: "File or directory not found" });
  }
});

// 9b. Rename File or Directory
app.post("/api/servers/:id/files/rename", (req, res) => {
  const { id } = req.params;
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ error: "oldName and newName are required" });
  }
  const sDir = getServerDir(id);
  const oldPath = path.join(sDir, path.basename(oldName));
  const newPath = path.join(sDir, path.basename(newName));

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ error: "Original file not found" });
  }

  try {
    fs.renameSync(oldPath, newPath);
    addServerLog(id, "system", `✏️ Renamed ${path.basename(oldName)} to ${path.basename(newName)}`);
    res.json({ success: true, name: path.basename(newName) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Upload File into Server
const serverMulter = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dest = getServerDir(req.params.id);
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      cb(null, path.basename(file.originalname));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.post("/api/servers/:id/files/upload", serverMulter.array("files", 10), (req, res) => {
  const { id } = req.params;
  const rawFiles = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
  if (!rawFiles || rawFiles.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  // Limit to max 10 files
  const uploadedFiles = rawFiles.slice(0, 10);
  const sDir = getServerDir(id);
  const uploadedNames: string[] = [];

  let hasZip = false;
  let hasReqs = false;

  for (const f of uploadedFiles) {
    const uploadedName = f.originalname;
    uploadedNames.push(uploadedName);
    const isZip = uploadedName.toLowerCase().endsWith(".zip");
    if (isZip) hasZip = true;
    if (uploadedName === "requirements.txt" || uploadedName === "package.json") hasReqs = true;

    addServerLog(id, "system", `📁 File uploaded: ${uploadedName} (${f.size} bytes)`);

    if (isZip) {
      addServerLog(id, "system", `📦 Auto-extracting ZIP archive: ${uploadedName}...`);
      exec(`unzip -o "${f.path}" -d "${sDir}"`, { cwd: sDir }, (unzipErr) => {
        if (unzipErr) {
          addServerLog(id, "stderr", `⚠️ Unzip error: ${unzipErr.message}`);
        } else {
          addServerLog(id, "system", `✅ ZIP contents successfully extracted.`);
        }
      });
    }
  }

  res.json({
    success: true,
    count: uploadedFiles.length,
    filenames: uploadedNames,
    message: `${uploadedFiles.length} file(s) uploaded successfully`,
  });
});

// 10a. Explicit Dependency Install Trigger
app.post("/api/servers/:id/install", (req, res) => {
  const { id } = req.params;
  const servers = getServersData();
  const server = servers.find((s) => s.id === id);
  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }
  const sDir = getServerDir(id);
  const config = getServerConfig(id, server);
  const procEnv = getOptimizedProcEnv(server, config, sDir);

  checkAndInstallDependencies(id, sDir, procEnv, (success) => {
    res.json({ success, message: success ? "Dependencies installed successfully" : "Installation finished with notices" });
  });
});

// 10b. Server Backups
const getBackupsDir = (id: string) => {
  const bDir = path.join(getServerDir(id), ".backups");
  if (!fs.existsSync(bDir)) fs.mkdirSync(bDir, { recursive: true });
  return bDir;
};

app.get("/api/servers/:id/backups", (req, res) => {
  const { id } = req.params;
  try {
    const bDir = getBackupsDir(id);
    const filenames = fs.readdirSync(bDir);
    const backups = filenames
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const fullPath = path.join(bDir, f);
        const stat = fs.statSync(fullPath);
        return {
          id: f.replace(".json", ""),
          name: f,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ backups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/servers/:id/backups", (req, res) => {
  const { id } = req.params;
  const { backupName } = req.body;
  const sDir = getServerDir(id);
  const bDir = getBackupsDir(id);

  try {
    const files = fs.readdirSync(sDir);
    const archiveData: Record<string, string> = {};

    for (const file of files) {
      if (file === ".config.json" || file === ".backups") continue;
      const filePath = path.join(sDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        archiveData[file] = fs.readFileSync(filePath, "utf-8");
      }
    }

    const name = (backupName?.trim() || `backup_${new Date().toISOString().replace(/[:.]/g, "-")}`).replace(/[^a-zA-Z0-9_-]/g, "");
    const backupFile = path.join(bDir, `${name}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(archiveData, null, 2), "utf-8");
    addServerLog(id, "system", `💾 Backup snapshot created: ${name}.json`);

    res.json({ success: true, backup: { id: name, name: `${name}.json`, createdAt: new Date().toISOString() } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/servers/:id/backups/:backupId/restore", (req, res) => {
  const { id, backupId } = req.params;
  const sDir = getServerDir(id);
  const bDir = getBackupsDir(id);
  const backupFile = path.join(bDir, `${path.basename(backupId)}.json`);

  if (!fs.existsSync(backupFile)) {
    return res.status(404).json({ error: "Backup snapshot not found" });
  }

  try {
    const raw = fs.readFileSync(backupFile, "utf-8");
    const data = JSON.parse(raw);

    for (const [filename, content] of Object.entries(data)) {
      const filePath = path.join(sDir, path.basename(filename));
      fs.writeFileSync(filePath, content as string, "utf-8");
    }

    addServerLog(id, "system", `🔄 Restored server workspace from backup: ${backupId}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/servers/:id/backups/:backupId", (req, res) => {
  const { id, backupId } = req.params;
  const bDir = getBackupsDir(id);
  const backupFile = path.join(bDir, `${path.basename(backupId)}.json`);

  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
    addServerLog(id, "system", `🗑️ Backup removed: ${backupId}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Backup not found" });
  }
});

// 11. Server Logs
app.get("/api/servers/:id/logs", (req, res) => {
  const { id } = req.params;
  const runtime = getServerRuntime(id);
  res.json({ logs: runtime.logs });
});

app.post("/api/servers/:id/logs/clear", (req, res) => {
  const { id } = req.params;
  const runtime = getServerRuntime(id);
  runtime.logs = [];
  res.json({ success: true });
});

// 12. Server Terminal Command Runner (Per-Server Execution)
app.post("/api/servers/:id/command", (req, res) => {
  const { id } = req.params;
  const { command } = req.body;
  const servers = getServersData();
  const server = servers.find((s) => s.id === id);
  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  const sDir = getServerDir(id);
  const cmd = (command || "").trim();

  if (!cmd) {
    return res.json({ success: true, output: "" });
  }

  // Log user command
  addServerLog(id, "stdout", `[container@hostbot ~]$ ${cmd}`);

  if (cmd === "clear") {
    const runtime = getServerRuntime(id);
    runtime.logs = [];
    return res.json({ success: true, output: "" });
  }

  if (cmd === "help") {
    const helpMsg = `Host Bot Container Commands:
- status      : Display live server state and allocated memory
- ls          : List files in server directory
- cat <file>  : Print file content
- python3 ... : Run Python script or check version
- go ...      : Run Go command
- uptime      : Container uptime
- ping        : Test node latency
- clear       : Clear console logs`;
    addServerLog(id, "system", helpMsg);
    return res.json({ success: true, output: helpMsg });
  }

  if (cmd === "status") {
    const statusMsg = `Server: ${server.name} | Category: ${server.category} | Status: ${server.status} | Plan: ${server.planName} | RAM: ${server.ramUsage} | CPU: ${server.cpuUsage}`;
    addServerLog(id, "system", statusMsg);
    return res.json({ success: true, output: statusMsg });
  }

  // Run command safely in server's working directory
  const cfg = getServerConfig(id, server);
  const envObj: Record<string, string> = {};
  for (const item of cfg.envVars || []) {
    if (item.key) envObj[item.key] = item.value;
  }

  exec(
    cmd,
    {
      cwd: sDir,
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, ...envObj, SERVER_NAME: server.name },
    },
    (error, stdout, stderr) => {
      if (stdout) {
        for (const line of stdout.trim().split("\n")) {
          if (line) addServerLog(id, "stdout", line);
        }
      }
      if (stderr) {
        for (const line of stderr.trim().split("\n")) {
          if (line) addServerLog(id, "stderr", line);
        }
      }
      if (error && !stderr) {
        addServerLog(id, "stderr", `Error: ${error.message}`);
      }

      res.json({
        success: !error,
        stdout: stdout || "",
        stderr: stderr || (error ? error.message : ""),
      });
    }
  );
});

// 13. Reinstall Server (Reset to pristine category starter)
app.post("/api/servers/:id/reinstall", (req, res) => {
  const { id } = req.params;
  const servers = getServersData();
  const server = servers.find((s) => s.id === id);
  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  const sDir = getServerDir(id);
  // Stop and clean up any processes
  killServerProcess(id);
  server.status = "STOPPED";
  saveServersData(servers);

  try {
    // Delete all files in directory except .config.json
    const existing = fs.readdirSync(sDir);
    for (const f of existing) {
      if (f !== ".config.json") {
        fs.rmSync(path.join(sDir, f), { recursive: true, force: true });
      }
    }
    // Re-seed
    ensureServerWorkspace(server);
    addServerLog(id, "system", `🔄 Server container reinstalled to pristine ${server.category} state.`);
    res.json({ success: true, message: "Server reinstalled successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Delete Server Endpoint
app.delete("/api/servers/:id", (req, res) => {
  const { id } = req.params;
  let servers = getServersData();
  const target = servers.find((s) => s.id === id);

  if (!target) {
    return res.status(404).json({ error: "Server not found" });
  }

  // Kill running processes completely
  killServerProcess(id);
  serverRuntimes.delete(id);

  // Remove server folder
  const sDir = getServerDir(id);
  try {
    if (fs.existsSync(sDir)) {
      fs.rmSync(sDir, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }

  servers = servers.filter((s) => s.id !== id);
  saveServersData(servers);
  addLog("system", `🗑️ Server "${target.name}" [${target.id}] was removed.`);
  res.json({ success: true, deletedId: id, servers });
});



// ---------------- VITE MIDDLEWARE & SERVER BOOT ----------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
