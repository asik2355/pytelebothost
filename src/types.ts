export interface WorkspaceFile {
  name: string;
  size: number;
  modified: string;
}

export interface WorkspaceStatus {
  files: WorkspaceFile[];
  currentEntryFile: string;
  status: "stopped" | "installing" | "running" | "error";
  uptimeSeconds: number;
  pid: number | null;
  lastExitCode: number | null;
  envKeys: string[];
  hasToken: boolean;
}

export interface BotLog {
  id: number;
  timestamp: string;
  type: "info" | "stdout" | "stderr" | "system" | "pip";
  message: string;
}

export interface TelegramBotProfile {
  id: number;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
}

export interface StarterTemplate {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  badge: string;
}

export interface AppNotification {
  id: string;
  title: string;
  titleBn: string;
  desc: string;
  descBn: string;
  timestamp: string;
  type: "deposit" | "plan" | "system" | "bot";
  read: boolean;
  amount?: number;
  method?: string;
  planName?: string;
  link?: string;
}

export type ServerCategory = "python3" | "node.js generic" | "golang" | "Bun";

export interface ActiveServer {
  id: string;
  name: string;
  category: ServerCategory | string;
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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  telegramUsername?: string;
  avatarUrl?: string;
  photoURL?: string;
  balance?: number;
  walletBalance?: number;
  createdAt?: string;
  lastLoginAt?: string;
  role?: string;
}

