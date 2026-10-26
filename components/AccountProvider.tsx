"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, backendConfigured } from "@/lib/supabase/client";
export const preferenceOptions = [
  "Avoid steps",
  "Prefer gentle slopes",
  "Find accessible washrooms",
];
type Account = {
  user: User | null;
  isAdmin: boolean;
  ready: boolean;
  configured: boolean;
  error: string;
  saved: string[];
  preferences: string[];
  setPreferences: (p: string[]) => Promise<void>;
  toggleSaved: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<Account | null>(null);
function guestData() {
  try {
    return {
      saved: JSON.parse(localStorage.getItem("access-nust-v2-saved") || "[]"),
      preferences: JSON.parse(
        localStorage.getItem("access-nust-v2-prefs") || "[]",
      ),
    };
  } catch {
    return { saved: [], preferences: [] };
  }
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [isAdmin, setAdmin] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState<string[]>([]),
    [preferences, setPrefs] = useState<string[]>([]);
  const generation = useRef(0),
    busy = useRef(false);
  useEffect(() => {
    let disposed = false;
    const db = getSupabase();
    async function load(u: User | null) {
      const current = ++generation.current;
      setReady(false);
      setUser(u);
      setAdmin(false);
      setSaved([]);
      setPrefs([]);
      setError("");
      if (!u) {
        const guest = guestData();
        setSaved(
          Array.isArray(guest.saved)
            ? guest.saved.filter((x: unknown) => typeof x === "string")
            : [],
        );
        setPrefs(
          Array.isArray(guest.preferences)
            ? guest.preferences.filter(
                (x: unknown) =>
                  typeof x === "string" && preferenceOptions.includes(x),
              )
            : [],
        );
        setReady(true);
        return;
      }
      const [profile, bookmarks, role] = await Promise.all([
        db!.from("profiles").select("preferences").eq("id", u.id).single(),
        db!.from("saved_places").select("place_id").eq("user_id", u.id),
        db!.rpc("is_admin"),
      ]);
      if (disposed || current !== generation.current) return;
      if (profile.error || bookmarks.error || role.error) {
        setError(
          "Could not load your account. Check the database setup or try signing in again.",
        );
        return;
      }
      setPrefs(
        (profile.data?.preferences || []).filter((x: string) =>
          preferenceOptions.includes(x),
        ),
      );
      setSaved((bookmarks.data || []).map((x) => x.place_id));
      setAdmin(role.data === true);
      setReady(true);
    }
    if (!db) {
      void load(null);
      return;
    }
    // INITIAL_SESSION and subsequent sign-in/out events use the same loading path.
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (!disposed) void load(session?.user || null);
      });
    });
    return () => {
      disposed = true;
      generation.current++;
      data.subscription.unsubscribe();
    };
  }, []);
  async function setPreferences(p: string[]) {
    if (!ready || busy.current)
      throw new Error("Account is loading or saving. Try again.");
    busy.current = true;
    const currentGeneration = generation.current;
    try {
      const next = [...new Set(p.filter((x) => preferenceOptions.includes(x)))];
      if (user) {
        const { data, error } = await getSupabase()!
          .from("profiles")
          .update({ preferences: next })
          .eq("id", user.id)
          .select("id")
          .single();
        if (error || !data)
          throw new Error("Preferences could not be saved. Please try again.");
      } else localStorage.setItem("access-nust-v2-prefs", JSON.stringify(next));
      if (currentGeneration === generation.current) setPrefs(next);
    } finally {
      busy.current = false;
    }
  }
  async function toggleSaved(id: string) {
    if (!ready || busy.current)
      throw new Error("Account is loading or saving. Try again.");
    busy.current = true;
    const currentGeneration = generation.current;
    try {
      const exists = saved.includes(id),
        next = exists ? saved.filter((x) => x !== id) : [...saved, id];
      if (user) {
        const db = getSupabase()!;
        const { error } = exists
          ? await db
              .from("saved_places")
              .delete()
              .eq("user_id", user.id)
              .eq("place_id", id)
          : await db
              .from("saved_places")
              .insert({ user_id: user.id, place_id: id });
        if (error)
          throw new Error(
            "Saved place could not be updated. Please try again.",
          );
      } else localStorage.setItem("access-nust-v2-saved", JSON.stringify(next));
      if (currentGeneration === generation.current) setSaved(next);
    } finally {
      busy.current = false;
    }
  }
  async function signOut() {
    const { error } = await getSupabase()!.auth.signOut();
    if (error) throw new Error("Sign out failed. Please try again.");
  }
  return (
    <Context.Provider
      value={{
        user,
        isAdmin,
        ready,
        configured: backendConfigured,
        error,
        saved,
        preferences,
        setPreferences,
        toggleSaved,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const c = useContext(Context);
  if (!c) throw new Error("AccountProvider missing");
  return c;
}
