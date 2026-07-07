import * as path from "node:path";
import { app } from "electron";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import store from "./store";

const envPath = app.isPackaged
  ? path.join(process.resourcesPath, ".env")
  : path.join(__dirname, "..", "..", ".env");

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_ANON_KEY must be set. Copy .env.example to .env and fill in your project values."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  // Electron's bundled Node.js doesn't expose a global WebSocket, which the
  // realtime client requires just to construct (even though we never use
  // realtime subscriptions) — provide the `ws` package as the transport.
  realtime: {
    transport: WebSocket as unknown as typeof globalThis.WebSocket,
  },
});

supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    store.set("session", {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }
});

export async function restoreSession(): Promise<boolean> {
  const saved = store.get("session");
  if (!saved) return false;
  const { error } = await supabase.auth.setSession({
    access_token: saved.access_token,
    refresh_token: saved.refresh_token,
  });
  return !error;
}

export async function clearSession(): Promise<void> {
  store.set("session", null);
  await supabase.auth.signOut();
}
