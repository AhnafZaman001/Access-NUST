"use client";
import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useAccount } from "@/components/AccountProvider";
import { initialPlaces, type Place } from "@/lib/places";
import {
  roleOptions,
  mobilityOptions,
  barrierOptions,
  facilityOptions,
  assistanceOptions,
  emptyAccessProfile,
  consentVersion,
  validateAccessProfile,
  type AccessProfile,
} from "@/lib/access-profile";
export default function AccessProfileForm() {
  const account = useAccount();
  const [profile, setProfile] = useState<AccessProfile>(emptyAccessProfile),
    [consent, setConsent] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [loadFailed, setLoadFailed] = useState(false),
    [places, setPlaces] = useState<Place[]>(initialPlaces),
    [search, setSearch] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/places")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.places) setPlaces(d.places);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!account.ready) {
      setLoading(true);
      return;
    }
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setMessage("");
    setProfile(emptyAccessProfile);
    setConsent(false);
    async function load() {
      try {
        if (account.user) {
          const { data, error } = await getSupabase()!
            .from("access_profiles")
            .select("*")
            .eq("user_id", account.user.id)
            .maybeSingle();
          if (error)
            throw new Error(
              "Your access profile could not load. The database update may still need to be applied.",
            );
          if (active && data) {
            setProfile(data as AccessProfile);
            setConsent(data.consent_version === consentVersion);
          }
        } else {
          const raw = localStorage.getItem("access-nust-access-profile");
          if (raw) {
            const p = JSON.parse(raw);
            validateAccessProfile(p);
            if (active) {
              setProfile(p);
              setConsent(p.consent_version === consentVersion);
            }
          }
        }
      } catch (e) {
        if (active) {
          setMessage(
            e instanceof Error ? e.message : "Profile could not load.",
          );
          setLoadFailed(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [account.ready, account.user?.id]);
  function toggle(
    key: "mobility_aids" | "barriers" | "facilities" | "frequent_place_ids",
    value: string,
  ) {
    setProfile((p) => {
      let next = p[key].includes(value)
        ? p[key].filter((x) => x !== value)
        : [...p[key], value];
      if (key === "mobility_aids") {
        if (value === "Prefer not to say" && next.includes(value))
          next = [value];
        else next = next.filter((x) => x !== "Prefer not to say");
      }
      return { ...p, [key]: next };
    });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const next = validateAccessProfile({
        ...profile,
        consent_version: consent ? consentVersion : "",
      });
      if (account.user) {
        const { error } = await getSupabase()!
          .from("access_profiles")
          .upsert({
            user_id: account.user.id,
            role: next.role,
            mobility_aids: next.mobility_aids,
            barriers: next.barriers,
            facilities: next.facilities,
            assistance: next.assistance,
            frequent_place_ids: next.frequent_place_ids,
            consent_version: next.consent_version,
            consented_at: new Date().toISOString(),
          });
        if (error)
          throw new Error(
            "Access profile could not be saved. Please try again or check the database update.",
          );
      } else
        localStorage.setItem(
          "access-nust-access-profile",
          JSON.stringify(next),
        );
      setProfile(next);
      setMessage(
        account.user
          ? "Access profile saved to your account."
          : "Access profile saved on this browser only. Sign in to submit it to the service.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }
  async function clear() {
    if (
      !window.confirm(
        "Delete your access profile? Your account and bookmarks will remain.",
      )
    )
      return;
    setSaving(true);
    try {
      if (account.user) {
        const { error } = await getSupabase()!
          .from("access_profiles")
          .delete()
          .eq("user_id", account.user.id);
        if (error) throw new Error("Profile could not be deleted.");
      } else localStorage.removeItem("access-nust-access-profile");
      setProfile(emptyAccessProfile);
      setConsent(false);
      setLoadFailed(false);
      setMessage("Access profile deleted.");
    } catch (e) {
      setMessage(String(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="access-profile-section" id="access-profile">
      <span className="eyebrow">YOUR MOBILITY & ACCESS NEEDS</span>
      <h2>Tell us what makes campus accessible to you.</h2>
      <p>
        Help identify the barriers and facilities that matter to you. You can
        skip optional questions and use the directory without a profile.
      </p>
      <p className="privacy-note">
        {account.user
          ? "Your answers are stored in your account and visible to you and the Access NUST administrator, to understand access needs and prioritize facility reviews."
          : "Guest answers stay on this browser. They are not submitted to the administrator or automatically uploaded when you sign in."}{" "}
        No diagnosis, medical document, or live location is requested. This
        profile does not provide a verified route or emergency assistance.
      </p>
      {account.error && <p role="alert">{account.error}</p>}
      {loading ? (
        <p>Loading access profile…</p>
      ) : (
        <form onSubmit={save} className="access-profile-form">
          <fieldset disabled={saving || loadFailed}>
            <legend>1. Your campus connection</legend>
            <label>
              I use NUST as
              <select
                required
                value={profile.role}
                onChange={(e) =>
                  setProfile({ ...profile, role: e.target.value })
                }
              >
                <option value="">Choose one</option>
                {roleOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </fieldset>
          <fieldset disabled={saving || loadFailed}>
            <legend>
              2. Getting around <small>Optional</small>
            </legend>
            <p>Which mobility aids do you use? Select all that apply.</p>
            <div className="need-options">
              {mobilityOptions.map((x) => (
                <label key={x}>
                  <input
                    type="checkbox"
                    checked={profile.mobility_aids.includes(x)}
                    onChange={() => toggle("mobility_aids", x)}
                  />
                  {x}
                </label>
              ))}
            </div>
            <label>
              Assistance when moving around campus
              <select
                value={profile.assistance}
                onChange={(e) =>
                  setProfile({ ...profile, assistance: e.target.value })
                }
              >
                <option value="">Skip this question</option>
                {assistanceOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </fieldset>
          <fieldset disabled={saving || loadFailed}>
            <legend>
              3. Barriers & facilities <small>Optional</small>
            </legend>
            <p>Which barriers affect your journey?</p>
            <div className="need-options">
              {barrierOptions.map((x) => (
                <label key={x}>
                  <input
                    type="checkbox"
                    checked={profile.barriers.includes(x)}
                    onChange={() => toggle("barriers", x)}
                  />
                  {x}
                </label>
              ))}
            </div>
            <p>Which facilities do you need?</p>
            <div className="need-options">
              {facilityOptions.map((x) => (
                <label key={x}>
                  <input
                    type="checkbox"
                    checked={profile.facilities.includes(x)}
                    onChange={() => toggle("facilities", x)}
                  />
                  {x}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={saving || loadFailed}>
            <legend>
              4. Regular destinations <small>Optional · up to 10</small>
            </legend>
            <p>
              Choose places you visit regularly so the administrator can
              prioritize access reviews. This does not track your visits.
            </p>
            <input
              aria-label="Search regular destinations"
              placeholder="Search library, school, medical centre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="destination-options">
              {places
                .filter((p) =>
                  (p.name + " " + p.aliases.join(" "))
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={profile.frequent_place_ids.includes(p.id)}
                      disabled={
                        !profile.frequent_place_ids.includes(p.id) &&
                        profile.frequent_place_ids.length >= 10
                      }
                      onChange={() => toggle("frequent_place_ids", p.id)}
                    />
                    {p.name}
                  </label>
                ))}
            </div>
            <small>{profile.frequent_place_ids.length} of 10 selected</small>
          </fieldset>
          <label className="consent">
            <input
              type="checkbox"
              required
              checked={consent}
              disabled={saving || loadFailed}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {account.user
              ? "I agree to store these answers and share them with the Access NUST administrator for accessibility planning. I can edit or delete them here."
              : "I agree to save these answers on this browser. I can edit or delete them here."}
          </label>
          <div className="account-actions">
            <button className="primary" disabled={saving || loadFailed}>
              {saving ? "Saving…" : "Save access profile"}
            </button>
            <button
              type="button"
              className="danger-button"
              disabled={saving}
              onClick={clear}
            >
              Delete access profile
            </button>
          </div>
        </form>
      )}
      {message && (
        <p role="status" className="account-message">
          {message}
        </p>
      )}
    </section>
  );
}
