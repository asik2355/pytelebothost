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
