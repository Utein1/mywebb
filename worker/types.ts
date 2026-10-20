export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
}

export interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionAdmin extends AdminRow {
  session_token_hash: string;
  session_expires_at: string;
}

export interface AppVariables {
  admin: SessionAdmin;
}

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
