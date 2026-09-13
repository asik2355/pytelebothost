import express from "express";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
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
  return {
    balance: 117.50, // Matches initial sample value in screenshot
    currency: "৳",
    transactions: [
      {
        id: "TX-1001",
        amount: 100,
        type: "deposit",
        description: "Wallet Recharge (bKash)",
        date: new Date(Date.now() - 86400000).toISOString(),
        status: "completed",
        method: "bKash",
      },
      {
        id: "TX-1000",
        amount: 17.50,
        type: "deposit",
        description: "Welcome Promotional Credit",
        date: new Date(Date.now() - 172800000).toISOString(),
        status: "completed",
        method: "Promo",
      }
    ],
  };
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

// ---------------- SERVERS MANAGEMENT API ----------------
const SERVERS_FILE = path.join(WORKSPACE_DIR, ".servers.json");

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
}

const DEFAULT_SERVERS: ServerRecord[] = [
  {
    id: "nova",
    name: "Nova",
    category: "python3",
    region: "EU • 043a9bc6",
    status: "RUNNING",
    ramUsage: "142.29 MB RAM",
    cpuUsage: "9.407% CPU",
    diskUsage: "83.92 MB Disk",
    daysLeft: "14d left",
    planName: "Free Starter",
    planPrice: 0,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "voltx",
    name: "Voltx",
    category: "node.js generic",
    region: "eu-24-3 • c67c3000",
    status: "RUNNING",
    ramUsage: "218.40 MB RAM",
    cpuUsage: "4.120% CPU",
    diskUsage: "120.50 MB Disk",
    daysLeft: "24d left",
    planName: "Mini-v1",
    planPrice: 100,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

function getServersData(): ServerRecord[] {
  try {
    if (fs.existsSync(SERVERS_FILE)) {
      const data = fs.readFileSync(SERVERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

app.get("/api/servers", (req, res) => {
  res.json({ servers: getServersData() });
});

app.post("/api/servers/create", (req, res) => {
  const { name, category, planName, price } = req.body;
  const serverName = (name || "").trim() || "Survivor Realm";
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
  const newServer: ServerRecord = {
    id: `srv-${Date.now()}`,
    name: serverName,
    category: serverCategory,
    region: `EU • ${hexHash}`,
    status: "RUNNING",
    ramUsage: "78.40 MB RAM",
    cpuUsage: "1.250% CPU",
    diskUsage: "45.10 MB Disk",
    daysLeft: "30d left",
    planName: planName || "Mini-v1",
    planPrice: numPrice,
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  const servers = getServersData();
  servers.push(newServer);
  saveServersData(servers);

  addLog(
    "system",
    `🚀 Server Created: "${serverName}" [${serverCategory}] under plan "${planName || "Mini-v1"}". Final Price: ৳${numPrice.toFixed(2)}.`
  );

  res.json({
    success: true,
    server: newServer,
    newBalance: wallet.balance,
    message: `Server "${serverName}" created successfully!`,
  });
});

app.post("/api/servers/action", (req, res) => {
  const { serverId, action } = req.body;
  const servers = getServersData();
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    return res.status(404).json({ error: "Server not found" });
  }

  if (action === "stop") {
    server.status = "STOPPED";
  } else if (action === "start" || action === "restart") {
    server.status = "RUNNING";
  }

  saveServersData(servers);
  res.json({ success: true, server });
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
