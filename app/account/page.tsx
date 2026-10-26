"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAccount, preferenceOptions } from "@/components/AccountProvider";
import { getSupabase } from "@/lib/supabase/client";
export default function Account() {
  const account = useAccount();
  const [mode, setMode] = useState<"signin" | "signup">("signin"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const db = getSupabase()!;
      const result =
        mode === "signup"
          ? await db.auth.signUp({ email, password })
          : await db.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup")
        setMessage(
          "Check your email to confirm your account before signing in.",
        );
      setPassword("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="account-page">
      <Link href="/" className="back-link">
        ← Back to campus
      </Link>
      <div className="account-shell">
        <span className="eyebrow">ACCESS NUST · YOUR SPACE</span>
        <h1>
          Your campus,
          <br />
          <span>your preferences.</span>
        </h1>
        <p>
          Save places and choose functional preferences. No medical history
          required.
        </p>
        {!account.configured ? (
          <div className="setup-panel">
            <h2>Account service is not connected yet</h2>
            <p>
              You can explore the directory and save preferences on this
              browser. Account sign-in will become available after the Supabase
              database is connected.
            </p>
            <Link className="primary" href="/">
              Continue as a guest →
            </Link>
          </div>
        ) : account.user ? (
          <section className="account-card">
            <h2>Your account</h2>
            <p>Signed in as {account.user.email}</p>
            {account.error && <p role="alert">{account.error}</p>}
            <p>
              Your saved places and preferences are private to your account.
              Administrators can manage profile information; bookmarks are
              visible only to you.
            </p>
            <h3>Accessibility preferences</h3>
            {preferenceOptions.map((p) => (
              <label className="preference-row" key={p}>
                {p}
                <input
                  type="checkbox"
                  checked={account.preferences.includes(p)}
                  disabled={!account.ready || busy}
                  onChange={async () => {
                    setBusy(true);
                    try {
                      await account.setPreferences(
                        account.preferences.includes(p)
                          ? account.preferences.filter((x) => x !== p)
                          : [...account.preferences, p],
                      );
                      setMessage("Preferences saved.");
                    } catch (e) {
                      setMessage(String(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
            ))}
            <div className="account-actions">
              <Link href="/" className="primary">
                Explore saved places
              </Link>
              {account.isAdmin && (
                <Link href="/admin">Open administration →</Link>
              )}
              <button
                disabled={busy}
                onClick={async () => {
                  try {
                    await account.signOut();
                    setMessage("Signed out.");
                  } catch (e) {
                    setMessage(String(e));
                  }
                }}
              >
                Sign out
              </button>
            </div>
          </section>
        ) : (
          <form className="account-card" onSubmit={submit}>
            <div className="auth-tabs">
              <button
                type="button"
                aria-pressed={mode === "signin"}
                onClick={() => {
                  setMode("signin");
                  setMessage("");
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={mode === "signup"}
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
              >
                Create account
              </button>
            </div>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {mode === "signup" && (
              <label className="consent">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I understand this independent service stores my account and
                chosen preferences. I will not submit medical records.
              </label>
            )}
            <button className="primary full" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
            <p className="privacy-note">
              Guest bookmarks are kept separate and are not automatically
              uploaded to your account. Contact the site administrator to
              request profile correction or account deletion.
            </p>
          </form>
        )}
        {message && (
          <p className="account-message" role="status">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
