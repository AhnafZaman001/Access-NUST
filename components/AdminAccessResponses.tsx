"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { initialPlaces } from "@/lib/places";
import type { AccessProfile } from "@/lib/access-profile";
type Response = AccessProfile & {
  user_id: string;
  updated_at: string;
  consented_at: string;
};
export default function AdminAccessResponses() {
  const [responses, setResponses] = useState<Response[]>([]),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getSupabase()!
      .from("access_profiles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setMessage(
            "Access responses could not load. Apply the access-profile database migration if it has not been installed.",
          );
        else setResponses(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="access-responses">
      <h2>Submitted access needs</h2>
      <p>
        Voluntary answers from signed-in users. Up to 200 recent profiles.
        Browser-only guest answers are not included.
      </p>
      {loading && <p>Loading responses…</p>}
      {message && <p role="alert">{message}</p>}
      {!loading && !message && !responses.length && (
        <p>No access profiles submitted yet.</p>
      )}
      {responses.map((p) => (
        <article className="account-card" key={p.user_id}>
          <small>User ID: {p.user_id}</small>
          <h3>{p.role} · access profile</h3>
          <dl>
            <dt>Mobility aids</dt>
            <dd>{p.mobility_aids.join(", ") || "Not answered"}</dd>
            <dt>Barriers</dt>
            <dd>{p.barriers.join(", ") || "Not answered"}</dd>
            <dt>Facilities needed</dt>
            <dd>{p.facilities.join(", ") || "Not answered"}</dd>
            <dt>Assistance</dt>
            <dd>{p.assistance || "Not answered"}</dd>
            <dt>Regular destinations</dt>
            <dd>
              {p.frequent_place_ids
                .map((id) => initialPlaces.find((x) => x.id === id)?.name || id)
                .join(", ") || "Not answered"}
            </dd>
            <dt>Consent</dt>
            <dd>
              {p.consent_version} ·{" "}
              {new Date(p.consented_at).toLocaleDateString()}
            </dd>
          </dl>
          <button
            type="button"
            className="danger-button"
            onClick={async () => {
              if (!window.confirm("Delete this submitted access profile?"))
                return;
              const { error } = await getSupabase()!
                .from("access_profiles")
                .delete()
                .eq("user_id", p.user_id);
              if (error) setMessage("Could not delete access profile.");
              else
                setResponses((a) => a.filter((x) => x.user_id !== p.user_id));
            }}
          >
            Delete submitted access profile
          </button>
        </article>
      ))}
    </section>
  );
}
