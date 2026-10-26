"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { Place } from "@/lib/places";
import "leaflet/dist/leaflet.css";
export default function CampusMap({
  places,
  selected,
  onSelect,
}: {
  places: Place[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const group = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !host.current) return;
      const m = L.map(host.current, { zoomControl: false }).setView(
        [33.6443, 72.9905],
        16,
      );
      map.current = m;
      L.control.zoom({ position: "bottomright" }).addTo(m);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      })
        .on("tileerror", () => setOffline(true))
        .addTo(m);
      group.current = L.layerGroup().addTo(m);
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !group.current) return;
      group.current.clearLayers();
      places
        .filter((p) => p.lat !== null && p.lng !== null && p.location_verified)
        .forEach((p) => {
          const icon = L.divIcon({
            className: "custom-pin",
            html: `<span class="map-pin ${p.id === selected ? "selected" : ""}">${p.category === "Medical" ? "+" : p.category === "Washrooms" ? "WC" : p.category === "Study spaces" ? "▤" : "↗"}</span>`,
            iconSize: [42, 46],
            iconAnchor: [21, 40],
          });
          L.marker([p.lat!, p.lng!], { icon, title: p.name, alt: p.name })
            .on("click", () => onSelect(p.id))
            .addTo(group.current!);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [places, selected, ready, onSelect]);
  return (
    <>
      <div
        ref={host}
        className="map-canvas"
        aria-label="Interactive campus map; the adjacent list contains the same places"
      />
      {!places.some(
        (p) => p.lat !== null && p.lng !== null && p.location_verified,
      ) && (
        <div className="map-empty-note">
          Campus locations are being reviewed. Explore the directory while map
          pins are confirmed.
        </div>
      )}
      {offline && (
        <div className="tile-warning">
          Base map unavailable. The researched campus directory remains
          available.
        </div>
      )}
    </>
  );
}
