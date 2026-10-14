import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://jzazezgoezzxyidzvmor.supabase.co";
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YXplemdvZXp6eHlpZHp2bW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDUzOTAsImV4cCI6MjEwNzQ4MTM5MH0.XYrhjbgWndRdd8MLd753MBCTg-_DzK-qqcJ6MyiFtsg";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON;

  return createBrowserClient(url, key);
}
