"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Accessibility,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Bookmark,
  Heart,
  ShieldCheck,
  X,
  Check,
  Navigation,
  Settings2,
  Plus,
  Minus,
  Layers,
  Info,
  Building2,
  ChevronRight,
  Menu,
} from "lucide-react";
import {
  initialPlaces,
  categories,
  safeSource,
  type Place,
} from "@/lib/places";
import Link from "next/link";
import { useAccount, preferenceOptions } from "@/components/AccountProvider";
const CampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Preparing your campus map…</div>,
});
export default function Home() {
  const [tab, setTab] = useState("Explore campus");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All places");
  const [selected, setSelected] = useState("nust-medical-centre");
  const account = useAccount();
  const saved = account.saved;
  const [loadError, setLoadError] = useState("");
  const [source, setSource] = useState("research");
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [modal, setModal] = useState<"preferences" | "about" | null>(null);
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setPrefs(account.preferences);
  }, [account.preferences]);
  useEffect(() => {
    let active = true;
    fetch("/api/places")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (active) {
          setPlaces(d.places);
          setSource(d.source);
        }
      })
      .catch(() => {
        if (active)
          setLoadError(
            "Live directory could not load. Showing the bundled research directory; recent changes may be missing.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const select = useCallback((id: string) => {
    setSelected(id);
  }, []);
  const filtered = places.filter(
    (p) =>
      (filter === "All places" || p.category === filter) &&
      (tab !== "Saved places" || saved.includes(p.id)) &&
      (p.name + " " + p.area + " " + p.aliases.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const current = filtered.find((p) => p.id === selected) || filtered[0];
  const toggleSave = async (id: string) => {
    try {
      await account.toggleSaved(id);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save place");
    }
  };
  async function savePreferences() {
    setSaving(true);
    try {
      await account.setPreferences(prefs);
      setModal(null);
      setNotice(
        account.user
          ? "Preferences saved to your account"
          : "Preferences saved on this browser",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save preferences");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <a className="skip" href="#explore">
        Skip to campus explorer
      </a>
      <header className="header">
        <a href="/" className="brand">
          <span className="brand-mark">
            <Accessibility size={24} />
          </span>
          <span>
            access<span className="brand-light">nust</span>
            <small>A CAMPUS FOR EVERYONE</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={tab === "Explore campus" ? "nav-active" : ""}
            onClick={() => setTab("Explore campus")}
          >
            Explore campus
          </button>
          <button
            className={tab === "Saved places" ? "nav-active" : ""}
            onClick={() => setTab("Saved places")}
          >
            Saved places{" "}
            {saved.length > 0 && <span className="count">{saved.length}</span>}
          </button>
          <button onClick={() => setModal("about")}>
            Our mission <ArrowUpRight size={13} />
          </button>
        </nav>
        <Link href="/account" className="account-link">
          {account.user ? "Your account" : "Sign in"}
        </Link>
        <button
          className="profile-button"
          onClick={() => setModal("preferences")}
        >
          <span className="avatar">Y</span>
          <span>Your preferences</span>
          <Settings2 size={16} />
        </button>
      </header>
      <main>
        {(loadError || account.error) && (
          <p className="error-banner" role="alert">
            {loadError || account.error}
          </p>
        )}
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span /> INDEPENDENT INITIATIVE · NUST H-12
            </div>
            <h1>
              Your campus.
              <br />
              <span>More possibilities.</span>
            </h1>
            <p>
              Find the spaces that work for you.
              <br className="mobile-break" /> Explore a more accessible NUST,
              one place at a time.
            </p>
            <div className="hero-actions">
              <a className="primary" href="#explore">
                Explore the map <ArrowRight size={17} />
              </a>
              <button
                className="text-button"
                onClick={() => setModal("preferences")}
              >
                <SlidersHorizontal size={16} /> Make it yours
              </button>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-grid" />
            <div className="art-path" />
            <div className="art-orbit" />
            <span className="art-pin pin-a">
              <Accessibility size={31} />
            </span>
            <span className="art-pin pin-b">
              <Heart size={22} />
            </span>
            <span className="art-pin pin-c">
              <Building2 size={22} />
            </span>
            <div className="art-card">
              <span className="mini-check">
                <Check size={17} />
              </span>
              <div>
                Designed around you
                <small>Different needs. Shared possibilities.</small>
              </div>
            </div>
            <span className="art-label">
              A little more access.
              <br />A lot more independence.
            </span>
          </div>
        </section>
        <section className="explorer" id="explore">
          <div className="section-heading">
            <div>
              <div className="eyebrow muted">FIND YOUR WAY</div>
              <h2>
                {tab === "Saved places"
                  ? "Your saved places"
                  : "Explore your campus"}
              </h2>
            </div>
            <span className="campus-badge">
              <MapPin size={14} /> H-12, Islamabad <span className="dot" />
            </span>
          </div>
          <div className="toolbar">
            <label className="search">
              <Search size={19} />
              <input
                aria-label="Search campus places"
                placeholder="Search a building, facility, or space…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={16} />
                </button>
              )}
            </label>
            <div className="filters" aria-label="Place categories">
              {["All places", ...categories].map((c) => (
                <button
                  key={c}
                  aria-pressed={filter === c}
                  className={filter === c ? "filter active" : "filter"}
                  onClick={() => {
                    setFilter(c);
                  }}
                >
                  {c === "All places" && <Layers size={14} />} {c}
                </button>
              ))}
            </div>
          </div>
          <div className="workspace">
            <aside className="results" aria-label="Campus places">
              <div className="result-heading">
                <strong>{filtered.length} places to explore</strong>
                <span>
                  {source === "supabase"
                    ? "CAMPUS DIRECTORY"
                    : "RESEARCH DIRECTORY"}
                </span>
              </div>
              <div className="place-list">
                {filtered.length === 0 ? (
                  <div className="empty">
                    <Bookmark />
                    <h3>
                      {tab === "Saved places"
                        ? "Your places, all together"
                        : "No matching places"}
                    </h3>
                    <p>
                      {tab === "Saved places"
                        ? "Save a place from the map to find it here."
                        : "Try another name or category."}
                    </p>
                    <button
                      onClick={() => {
                        setQuery("");
                        setFilter("All places");
                        setTab("Explore campus");
                      }}
                    >
                      Explore all places
                    </button>
                  </div>
                ) : (
                  filtered.map((p) => (
                    <article
                      key={p.id}
                      className={
                        "place-card " + (current?.id === p.id ? "chosen" : "")
                      }
                    >
                      <button
                        className="place-select"
                        onClick={() => select(p.id)}
                        aria-pressed={current?.id === p.id}
                      >
                        <span
                          className={
                            "place-icon icon-" + p.category.split(" ")[0]
                          }
                        >
                          {p.category === "Medical" ? (
                            <Heart size={20} />
                          ) : p.category === "Study spaces" ? (
                            <Building2 size={20} />
                          ) : p.category === "Washrooms" ? (
                            <Accessibility size={20} />
                          ) : (
                            <ArrowUpRight size={20} />
                          )}
                        </span>
                        <span className="place-copy">
                          <small>{p.category}</small>
                          <strong>{p.name}</strong>
                          <span>
                            <MapPin size={11} />
                            {p.area}
                          </span>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                      <div className="place-bottom">
                        <span className="sample-dot" />{" "}
                        {p.location_verified
                          ? "Location reviewed"
                          : "Location not yet mapped"}
                        <button
                          aria-label={
                            (saved.includes(p.id) ? "Unsave " : "Save ") +
                            p.name
                          }
                          aria-pressed={saved.includes(p.id)}
                          onClick={() => toggleSave(p.id)}
                        >
                          <Bookmark
                            size={16}
                            fill={
                              saved.includes(p.id) ? "currentColor" : "none"
                            }
                          />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
              <div className="list-footer">
                <Info size={15} />
                <span>Better information. More confident choices.</span>
              </div>
            </aside>
            <div className="map-panel">
              <CampusMap
                places={filtered}
                selected={current?.id || ""}
                onSelect={select}
              />
              <div className="map-chip">
                <span className="live-dot" /> NUST H-12{" "}
                <span>Campus explorer</span>
              </div>
              <div className="map-disclaimer">
                <Info size={13} /> Only reviewed coordinates appear on the map
              </div>
              {current && (
                <div className="detail-card">
                  <div className="detail-top">
                    <span className="detail-kicker">
                      {current.guideMarkers.length
                        ? `CAMPUS GUIDE · #${current.guideMarkers.join(", #")}`
                        : "RESEARCH RECORD"}
                    </span>
                    <button
                      aria-label={
                        (saved.includes(current.id) ? "Unsave " : "Save ") +
                        current.name +
                        " from details"
                      }
                      onClick={() => toggleSave(current.id)}
                    >
                      <Bookmark
                        size={18}
                        fill={
                          saved.includes(current.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                  <h3>{current.name}</h3>
                  <p>{current.note}</p>
                  <p className="location-status">
                    {current.lat !== null && current.location_verified
                      ? "Location reviewed. Accessibility is reported separately."
                      : "Exact location awaiting confirmation. This place is searchable but has no map pin."}
                  </p>
                  <div className="feature-tags">
                    {current.features.map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </div>
                  <details className="evidence-details">
                    <summary>
                      Sources & limitations ({current.evidence.length})
                    </summary>
                    <ul>
                      {current.evidence.map((e, i) => (
                        <li key={i}>
                          {safeSource(e.url) ? (
                            <a
                              href={safeSource(e.url)!}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {e.claim} ↗
                            </a>
                          ) : (
                            <span>{e.claim}</span>
                          )}
                          <small>
                            {e.evidenceAccess.replaceAll("_", " ")}
                            {e.accessedDate
                              ? ` · Accessed ${e.accessedDate}`
                              : ""}
                          </small>
                        </li>
                      ))}
                    </ul>
                    <p>{current.limitations.join(" ")}</p>
                  </details>
                  <div className="route-unavailable">
                    <Navigation size={14} /> Route guidance awaits a campus
                    access survey.
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="data-note">
            <Info size={14} /> Research-based directory. A listed place is not a
            promise of accessibility. Check the evidence and current campus
            conditions.{" "}
            <button onClick={() => setModal("about")}>
              About our data <ArrowUpRight size={12} />
            </button>
          </p>
        </section>
        <section className="mission-strip">
          <div className="mission-icon">
            <Heart size={24} />
          </div>
          <div>
            <h3>Access is a shared responsibility.</h3>
            <p>
              Our vision: a campus where everyone can move with greater
              independence.
            </p>
          </div>
          <button className="text-button" onClick={() => setModal("about")}>
            Meet the mission <ArrowUpRight size={16} />
          </button>
        </section>
      </main>
      <footer>
        <span className="footer-brand">
          access<span>nust</span>
        </span>
        <p>
          Built for belonging. An independent initiative, not an official NUST
          service.
        </p>
        <Link href="/admin" className="admin-link">
          <ShieldCheck size={14} /> Campus administration
        </Link>
      </footer>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {modal && (
        <Modal
          title={
            modal === "preferences"
              ? "A campus experience for you"
              : "More access. More independence."
          }
          close={() => setModal(null)}
        >
          {modal === "preferences" ? (
            <>
              <p>
                Choose what matters to you.{" "}
                {account.user
                  ? "Preferences are stored privately in your account."
                  : "Guest preferences stay on this browser."}{" "}
                They do not certify routes or filter unverified features.
              </p>
              <div className="preference-options">
                {preferenceOptions.map((p) => (
                  <label key={p}>
                    <span>{p}</span>
                    <input
                      type="checkbox"
                      checked={prefs.includes(p)}
                      onChange={() =>
                        setPrefs((a) =>
                          a.includes(p) ? a.filter((x) => x !== p) : [...a, p],
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="privacy-note">
                No diagnosis needed. We do not track your location.{" "}
                {account.user
                  ? "You and the site administrator can manage your preferences."
                  : "Sign in to save preferences across devices."}
              </p>
              <button
                className="primary full"
                onClick={savePreferences}
                disabled={saving || !account.ready}
              >
                {saving ? "Saving…" : "Save preferences"} <Check size={17} />
              </button>
            </>
          ) : (
            <>
              <p>
                Access NUST is an independent initiative for students and
                visitors at NUST H-12, Islamabad. Our goal is to make
                accessibility information easier to find, understand, and
                improve.
              </p>
              <h3>Honest information comes first</h3>
              <p>
                This directory combines a supplied campus guide with provisional
                online research. Sources and their limitations are shown on each
                record. Unconfirmed coordinates are withheld. Map tiles come
                from OpenStreetMap and do not establish wheelchair access.
              </p>
              <h3>From demonstration to dependable data</h3>
              <p>
                The next stage is a campus survey: document entrances, measure
                ramps, check washroom facilities, and record who verified each
                detail and when.
              </p>
              <a
                className="source-link"
                href="https://nust.edu.pk"
                target="_blank"
                rel="noreferrer"
              >
                NUST official website <ArrowUpRight size={14} />
              </a>
              <p className="privacy-note">
                Some online findings were available only as search excerpts. The
                guide has 2022 file metadata, not a confirmed publication date.
                A facility missing from the guide may still exist today.
              </p>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const box = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        box?.querySelectorAll<HTMLElement>('button,a,input,[tabindex="0"]') ||
          [],
      );
    focusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const els = focusable(),
          first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal"
      >
        <button
          className="modal-close"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={22} />
        </button>
        <span className="eyebrow">ACCESS NUST</span>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
