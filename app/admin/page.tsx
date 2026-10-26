"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAccount, preferenceOptions } from "@/components/AccountProvider";
import { getSupabase } from "@/lib/supabase/client";
import {
  categories,
  accessKeys,
  featureLabels,
  fromRow,
  type Place,
  type AccessStatus,
} from "@/lib/places";
function blankPlace(): Place {
  return {
    id: `custom-${crypto.randomUUID()}`,
    name: "",
    category: "Other",
    area: "NUST H-12",
    lat: null,
    lng: null,
    features: [],
    note: "",
    guideMarkers: [],
    aliases: [],
    accessibility: {
      stepFreeEntrance: "unknown",
      ramp: "unknown",
      lift: "unknown",
      accessibleWashroom: "unknown",
      accessibleParking: "unknown",
    },
    evidence: [],
    limitations: [],
    published: false,
    location_verified: false,
    location_source: null,
    checked_at: null,
  };
}
type Profile = { id: string; display_name: string; preferences: string[] };
export default function Admin() {
  const account = useAccount();
  const [places, setPlaces] = useState<Place[]>([]),
    [profiles, setProfiles] = useState<Profile[]>([]),
    [selected, setSelected] = useState<Place | null>(null),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [creating, setCreating] = useState(false),
    [source, setSource] = useState(""),
    [claim, setClaim] = useState(""),
    [tab, setTab] = useState<"places" | "profiles">("places");
  useEffect(() => {
    if (!account.ready || !account.isAdmin) return;
    let active = true;
    const db = getSupabase()!;
    Promise.all([
      db.from("places").select("*").order("name").limit(500),
      db
        .from("profiles")
        .select("id,display_name,preferences")
        .order("id")
        .limit(200),
    ]).then(([p, u]) => {
      if (!active) return;
      if (p.error || u.error) {
        setMessage(
          "Could not load administration data. Check database permissions.",
        );
        return;
      }
      setPlaces((p.data || []).map(fromRow));
      setProfiles(u.data || []);
    });
    return () => {
      active = false;
    };
  }, [account.ready, account.isAdmin]);
  function edit(p: Place, isNew = false) {
    setSelected(structuredClone(p));
    setCreating(isNew);
    setSource("");
    setClaim("");
    setMessage("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      if ((selected.lat === null) !== (selected.lng === null))
        throw new Error(
          "Provide both latitude and longitude, or leave both blank.",
        );
      if (Boolean(source) !== Boolean(claim))
        throw new Error(
          "Provide both an evidence URL and a description of the observed claim.",
        );
      const evidence = [...selected.evidence];
      if (source) {
        const u = new URL(source);
        if (u.protocol !== "https:")
          throw new Error("Evidence must use an HTTPS source URL.");
        evidence.push({
          claim: claim.trim(),
          url: u.href,
          evidenceAccess: "admin_report",
          accessedDate: new Date().toISOString().slice(0, 10),
          publicationDate: null,
        });
      }
      if (
        accessKeys.some((k) => selected.accessibility[k] !== "unknown") &&
        (!selected.checked_at || !evidence.length)
      )
        throw new Error(
          "Reported accessibility requires a check date and supporting evidence.",
        );
      const row = {
        id: selected.id,
        name: selected.name.trim(),
        category: selected.category,
        description: selected.note.trim(),
        latitude: selected.lat,
        longitude: selected.lng,
        location_verified: selected.location_verified,
        location_source: selected.location_source || null,
        accessibility: selected.accessibility,
        evidence,
        checked_at: selected.checked_at || null,
        published: selected.published,
        guide_markers: selected.guideMarkers,
        aliases: selected.aliases,
        limitations: selected.limitations,
      };
      const db = getSupabase()!;
      const { data, error } = creating
        ? await db.from("places").insert(row).select().single()
        : await db
            .from("places")
            .update(row)
            .eq("id", selected.id)
            .select()
            .single();
      if (error)
        throw new Error(
          "The database rejected this change. Check field values and admin permissions.",
        );
      const p = fromRow(data);
      setPlaces((a) =>
        creating ? [...a, p] : a.map((x) => (x.id === p.id ? p : x)),
      );
      setSelected(p);
      setCreating(false);
      setSource("");
      setClaim("");
      setMessage(
        "Campus record saved. Published changes appear in the directory on refresh.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !selected ||
      creating ||
      !window.confirm(
        `Delete ${selected.name}? Associated bookmarks will also be removed.`,
      )
    )
      return;
    setBusy(true);
    try {
      const { data, error } = await getSupabase()!
        .from("places")
        .delete()
        .eq("id", selected.id)
        .select("id");
      if (error || !data?.length) throw new Error("Deletion failed.");
      setPlaces((a) => a.filter((x) => x.id !== selected.id));
      setSelected(null);
      setMessage("Campus record deleted.");
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-page">
      <Link href="/" className="back-link">
        ← Back to campus
      </Link>
      <div className="section-heading">
        <div>
          <span className="eyebrow">ACCESS NUST · ADMINISTRATION</span>
          <h1>Care for the campus.</h1>
          <p>Maintain evidence, review locations, and manage profiles.</p>
        </div>
      </div>
      {!account.configured ? (
        <section className="setup-panel">
          <h2>Connect the database to manage records</h2>
          <p>
            Administration requires Supabase authentication and
            database-enforced admin permissions. Public visitors cannot edit the
            researched directory.
          </p>
          <Link href="/" className="primary">
            View campus directory →
          </Link>
        </section>
      ) : account.error ? (
        <p role="alert" className="error-banner">
          {account.error}
        </p>
      ) : !account.ready ? (
        <p>Checking your account…</p>
      ) : !account.user ? (
        <section className="setup-panel">
          <h2>Administrator sign-in required</h2>
          <Link className="primary" href="/account">
            Sign in →
          </Link>
        </section>
      ) : !account.isAdmin ? (
        <section className="setup-panel">
          <h2>This account does not have administrator access</h2>
          <p>
            Your preferences and saved places are available in your account.
          </p>
          <Link href="/account">Return to your account →</Link>
        </section>
      ) : (
        <>
          <div className="auth-tabs">
            <button
              aria-pressed={tab === "places"}
              onClick={() => setTab("places")}
            >
              Campus records ({places.length})
            </button>
            <button
              aria-pressed={tab === "profiles"}
              onClick={() => setTab("profiles")}
            >
              User profiles ({profiles.length})
            </button>
          </div>
          {message && (
            <p role="status" className="account-message">
              {message}
            </p>
          )}
          {tab === "profiles" ? (
            <section className="profile-grid">
              <p>
                Profiles contain display names and functional preferences only.
                Bookmarks are private to each user. Up to 200 profiles are
                shown.
              </p>
              {profiles.map((p) => (
                <form
                  className="account-card"
                  key={p.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    const { data, error } = await getSupabase()!
                      .from("profiles")
                      .update({
                        display_name: p.display_name,
                        preferences: p.preferences,
                      })
                      .eq("id", p.id)
                      .select("id");
                    setMessage(
                      error || !data?.length
                        ? "Profile update failed."
                        : "Profile updated.",
                    );
                    setBusy(false);
                  }}
                >
                  <small>User ID: {p.id}</small>
                  <label>
                    Display name
                    <input
                      maxLength={100}
                      value={p.display_name}
                      onChange={(e) =>
                        setProfiles((a) =>
                          a.map((x) =>
                            x.id === p.id
                              ? { ...x, display_name: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  {preferenceOptions.map((option) => (
                    <label className="preference-row" key={option}>
                      {option}
                      <input
                        type="checkbox"
                        checked={p.preferences.includes(option)}
                        onChange={() =>
                          setProfiles((a) =>
                            a.map((x) =>
                              x.id === p.id
                                ? {
                                    ...x,
                                    preferences: x.preferences.includes(option)
                                      ? x.preferences.filter(
                                          (y) => y !== option,
                                        )
                                      : [...x.preferences, option],
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <button className="primary" disabled={busy}>
                    Save profile
                  </button>
                </form>
              ))}
            </section>
          ) : (
            <div className="admin-layout">
              <aside className="admin-list">
                <button
                  className="primary full"
                  onClick={() => edit(blankPlace(), true)}
                >
                  + Add campus record
                </button>
                <input
                  aria-label="Search admin records"
                  placeholder="Search records…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {places
                  .filter((p) =>
                    p.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((p) => (
                    <button
                      key={p.id}
                      className={selected?.id === p.id ? "selected-record" : ""}
                      onClick={() => edit(p)}
                    >
                      <strong>{p.name}</strong>
                      <small>
                        {p.published ? "Published" : "Draft"} ·{" "}
                        {p.location_verified
                          ? "Location reviewed"
                          : "Needs location"}
                      </small>
                    </button>
                  ))}
              </aside>
              {selected ? (
                <form className="admin-editor account-card" onSubmit={save}>
                  <h2>{creating ? "Add a campus record" : selected.name}</h2>
                  <label>
                    Place name
                    <input
                      required
                      maxLength={160}
                      value={selected.name}
                      onChange={(e) =>
                        setSelected({ ...selected, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={selected.category}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          category: e.target.value as Place["category"],
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Description
                    <textarea
                      maxLength={4000}
                      value={selected.note}
                      onChange={(e) =>
                        setSelected({ ...selected, note: e.target.value })
                      }
                    />
                  </label>
                  <div className="form-pair">
                    <label>
                      Latitude
                      <input
                        type="number"
                        min={-90}
                        max={90}
                        step="any"
                        value={selected.lat ?? ""}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            lat:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Longitude
                      <input
                        type="number"
                        min={-180}
                        max={180}
                        step="any"
                        value={selected.lng ?? ""}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            lng:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Location evidence URL
                    <input
                      type="url"
                      placeholder="https://…"
                      value={selected.location_source || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          location_source: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="preference-row">
                    Location reviewed for public mapping
                    <input
                      type="checkbox"
                      checked={selected.location_verified}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          location_verified: e.target.checked,
                        })
                      }
                    />
                  </label>
                  <p className="privacy-note">
                    Only reviewed coordinates get a map pin. Location review
                    does not establish wheelchair access.
                  </p>
                  <h3>Accessibility observations</h3>
                  {accessKeys.map((k) => (
                    <label className="preference-row" key={k}>
                      {featureLabels[k]}
                      <select
                        value={selected.accessibility[k]}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            accessibility: {
                              ...selected.accessibility,
                              [k]: e.target.value as AccessStatus,
                            },
                          })
                        }
                      >
                        <option value="unknown">Unknown</option>
                        <option value="yes">Reported available</option>
                        <option value="no">Reported unavailable</option>
                      </select>
                    </label>
                  ))}
                  <label>
                    Accessibility check date
                    <input
                      type="date"
                      value={selected.checked_at || ""}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        setSelected({ ...selected, checked_at: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Add evidence URL
                    <input
                      type="url"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="https://…"
                    />
                  </label>
                  <label>
                    What does this source support?
                    <textarea
                      value={claim}
                      maxLength={2000}
                      onChange={(e) => setClaim(e.target.value)}
                    />
                  </label>
                  <p>
                    {selected.evidence.length} existing evidence items retained.
                  </p>
                  <label className="preference-row">
                    Published in campus directory
                    <input
                      type="checkbox"
                      checked={selected.published}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          published: e.target.checked,
                        })
                      }
                    />
                  </label>
                  <div className="account-actions">
                    <button className="primary" disabled={busy}>
                      {busy ? "Saving…" : "Save record"}
                    </button>
                    {!creating && (
                      <button
                        className="danger-button"
                        type="button"
                        onClick={remove}
                        disabled={busy}
                      >
                        Delete record
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="setup-panel">
                  <h2>Select a campus record</h2>
                  <p>
                    Review its sources before changing any location or
                    accessibility detail.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
