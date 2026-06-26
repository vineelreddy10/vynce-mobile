import { useEffect, useRef, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { useAuth } from "./useAuth";
import { updateProfile } from "../api/profile";

/**
 * Minimum distance (meters) the user must move before we fire
 * an API call to update the backend. Prevents thousands of
 * writes from GPS jitter.
 */
const MIN_DISTANCE_M = 500;

const POLL_INTERVAL_MS = 10 * 60 * 1000;

const MAX_POSITION_AGE_MS = 5 * 60 * 1000;

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Haversine distance in metres between two lat/lng pairs.
 */
function haversineDistance(a: Coords, b: Coords): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

/** Track the last location we successfully sent to the backend. */
let lastSentLocation: Coords | null = null;
/** Whether the user has permanently denied geolocation permission. */
let permissionDenied = false;

/**
 * Try Capacitor Geolocation (native GPS on mobile), falling back to
 * the browser Geolocation API for web preview / development.
 *
 * Capacitor uses the device GPS hardware which is far more precise
 * than the browser's estimated location.
 */
async function getCurrentPosition(): Promise<Coords | null> {
  if (permissionDenied) return null;

  // ── 1. Capacitor native geolocation ──────────────────────
  try {
    // Check if Capacitor is running (not web/browser preview)
    const permResult = await Geolocation.checkPermissions();
    if (permResult.location === "denied" || permResult.location === "prompt-with-rationale") {
      // Request permission if not already granted
      const reqResult = await Geolocation.requestPermissions();
      if (reqResult.location !== "granted") {
        permissionDenied = true;
        return null;
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: MAX_POSITION_AGE_MS,
    });

    return {
      lat: Math.round(pos.coords.latitude * 10000) / 10000,
      lng: Math.round(pos.coords.longitude * 10000) / 10000,
    };
  } catch {
    // Capacitor may throw if not running natively — fall through to browser API
  }

  // ── 2. Browser Geolocation fallback ───────────────────────
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          permissionDenied = true;
        }
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: MAX_POSITION_AGE_MS,
      },
    );
  });
}

/**
 * Reverse-geocode a lat/lng to a human-readable location name
 * using Nominatim (OpenStreetMap).
 */
async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const fallback = `${lat}, ${lng}`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    if (data?.display_name) {
      const parts = data.display_name.split(",");
      return parts.slice(0, 2).join(",").trim();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * useLocationSync
 * ─────────────────────────────────────────────────────────────
 *
 * Keeps the user's stored profile location up-to-date by:
 *  1. Fetching the device position on mount (with a 2 s delay).
 *  2. Re-fetching every `POLL_INTERVAL_MS` while visible.
 *  3. Re-fetching when the app returns to foreground
 *     (`visibilitychange`).
 *  4. **Only** calling the backend if the position changed by
 *     more than `MIN_DISTANCE_M` since the last write.
 *  5. Using Capacitor Geolocation (native GPS) on mobile for
 *     precise coordinates, falling back to the browser API
 *     during web preview/development.
 *  6. Stopping all attempts after a PERMISSION_DENIED error so
 *     we don't spam the user with permission prompts.
 *
 * Place once at the app root alongside `usePresence`.
 */
export function useLocationSync() {
  const { user, isAuthenticated } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    if (permissionDenied) return;

    const coords = await getCurrentPosition();
    if (!coords) return;

    // Skip if we haven't moved enough since last write
    if (lastSentLocation) {
      const dist = haversineDistance(lastSentLocation, coords);
      if (dist < MIN_DISTANCE_M) return;
    }

    lastSentLocation = coords;
    const name = await reverseGeocode(coords.lat, coords.lng);

    // Fire-and-forget — failures are non-critical
    updateProfile({
      location_lat: coords.lat,
      location_lng: coords.lng,
      location_name: name,
    }).catch(() => {});
  }, [user, isAuthenticated]);

  // ── Lifecycle ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Stop everything when logged out
      lastSentLocation = null;
      permissionDenied = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    // 1. Initial sync (short delay so the app finishes booting)
    const initTimer = setTimeout(sync, 2_000);

    // 2. Periodic polling while app is visible
    pollRef.current = setInterval(sync, POLL_INTERVAL_MS);

    // 3. Re-sync when app comes to foreground
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(initTimer);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated, user, sync]);
}

/**
 * Imperative one-shot location sync — useful for pages that
 * should refresh their position before showing results
 * (e.g. the discover/feed page).
 */
export async function syncLocationOnce(): Promise<void> {
  if (permissionDenied) return;
  const coords = await getCurrentPosition();
  if (!coords) return;

  // Debounce: skip if not moved far enough
  if (lastSentLocation) {
    const dist = haversineDistance(lastSentLocation, coords);
    if (dist < MIN_DISTANCE_M) return;
  }

  lastSentLocation = coords;
  const name = await reverseGeocode(coords.lat, coords.lng);

  updateProfile({
    location_lat: coords.lat,
    location_lng: coords.lng,
    location_name: name,
  }).catch(() => {});
}
