import WebSocket, { type RawData } from "ws";

export type AisDirection = "northbound" | "southbound" | "stopped" | "unknown";

export interface AisVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  sogKnots: number | null;
  cogDeg: number | null;
  headingDeg: number | null;
  direction: AisDirection;
  receivedAt: string;
  source: "AISStream" | "AIS feed";
}

export interface AisSnapshot {
  generatedAt: string;
  vessels: AisVessel[];
  health: { ok: boolean; detail: string; source: string };
}

// Fort Madison corridor, deliberately wider than the visible city map so the
// map can surface vessels approaching from both Lock 18 and Lock 19.
const FORT_MADISON_BBOX = [[[40.95, -91.65], [40.20, -90.90]]];
const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const SAMPLE_MS = 18_000;
const CACHE_MS = 90_000;
const RECENT_HOLD_MS = 5 * 60_000;

let cached: { at: number; value: AisSnapshot } | null = null;
let lastNonEmpty: { at: number; value: AisSnapshot } | null = null;
let inFlight: Promise<AisSnapshot> | null = null;

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function directionFromCourse(cog: number | null, sog: number | null): AisDirection {
  if (sog !== null && sog < 0.4) return "stopped";
  if (cog === null) return "unknown";
  // The Mississippi at Fort Madison runs predominantly north/south. This is a
  // display classification from current COG, not a claim about voyage intent.
  return cog >= 270 || cog < 90 ? "northbound" : "southbound";
}

function normalizeAisStreamMessage(payload: any): AisVessel | null {
  const messageType = payload?.MessageType;
  if (!["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport"].includes(messageType)) return null;

  const meta = payload?.MetaData ?? {};
  const body = payload?.Message?.[messageType] ?? {};
  const lat = numberOrNull(meta.Latitude ?? body.Latitude);
  const lon = numberOrNull(meta.Longitude ?? body.Longitude);
  const mmsiRaw = meta.MMSI ?? body.UserID;
  if (lat === null || lon === null || !mmsiRaw) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  const sog = numberOrNull(body.Sog);
  const cog = numberOrNull(body.Cog);
  const heading = numberOrNull(body.TrueHeading);
  const mmsi = String(mmsiRaw).padStart(9, "0");
  const rawName = String(meta.ShipName ?? "").trim();

  return {
    mmsi,
    name: rawName || `AIS ${mmsi}`,
    lat,
    lon,
    sogKnots: sog,
    cogDeg: cog,
    headingDeg: heading,
    direction: directionFromCourse(cog, sog),
    receivedAt: new Date().toISOString(),
    source: "AISStream"
  };
}

function normalizeHttpVessel(row: any): AisVessel | null {
  const lat = numberOrNull(row?.lat ?? row?.latitude ?? row?.Latitude);
  const lon = numberOrNull(row?.lon ?? row?.lng ?? row?.longitude ?? row?.Longitude);
  const mmsiRaw = row?.mmsi ?? row?.MMSI ?? row?.vesselMmsi;
  if (lat === null || lon === null || !mmsiRaw) return null;

  const sog = numberOrNull(row?.sogKnots ?? row?.sog ?? row?.speed ?? row?.SOG);
  const cog = numberOrNull(row?.cogDeg ?? row?.cog ?? row?.course ?? row?.COG);
  const heading = numberOrNull(row?.headingDeg ?? row?.heading ?? row?.trueHeading);
  const mmsi = String(mmsiRaw).padStart(9, "0");
  return {
    mmsi,
    name: String(row?.name ?? row?.shipName ?? row?.vesselName ?? `AIS ${mmsi}`).trim(),
    lat,
    lon,
    sogKnots: sog,
    cogDeg: cog,
    headingDeg: heading,
    direction: directionFromCourse(cog, sog),
    receivedAt: String(row?.receivedAt ?? row?.timestamp ?? new Date().toISOString()),
    source: "AIS feed"
  };
}

async function fromHttpFeed(): Promise<AisSnapshot | null> {
  const url = process.env.AIS_FEED_URL?.trim();
  if (!url) return null;
  const token = process.env.AIS_FEED_TOKEN?.trim();
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const rows = Array.isArray(json) ? json : Array.isArray(json?.vessels) ? json.vessels : [];
    const vessels = rows.map(normalizeHttpVessel).filter((v: AisVessel | null): v is AisVessel => Boolean(v));
    return {
      generatedAt: new Date().toISOString(),
      vessels,
      health: { ok: true, detail: `${vessels.length} AIS vessel${vessels.length === 1 ? "" : "s"} returned by configured feed`, source: "AIS feed" }
    };
  } catch (error) {
    return {
      generatedAt: new Date().toISOString(),
      vessels: [],
      health: { ok: false, detail: `Configured AIS feed failed: ${error instanceof Error ? error.message : "unknown error"}`, source: "AIS feed" }
    };
  }
}

function fromAisStream(apiKey: string): Promise<AisSnapshot> {
  return new Promise(resolve => {
    const vessels = new Map<string, AisVessel>();
    let socketOpened = false;
    let subscriptionConfirmed = false;
    let settled = false;
    let socket: WebSocket | null = null;

    const finish = (detail?: string, ok = subscriptionConfirmed) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket?.close(); } catch {}
      const list = [...vessels.values()]
        .sort((a, b) => (b.sogKnots ?? 0) - (a.sogKnots ?? 0))
        .slice(0, 100);
      let defaultDetail = `${list.length} live AIS vessel${list.length === 1 ? "" : "s"} received in the Fort Madison corridor`;
      if (!list.length && subscriptionConfirmed) defaultDetail = `AISStream subscription confirmed; no position report arrived during the ${Math.round(SAMPLE_MS / 1000)}-second sample`;
      if (!subscriptionConfirmed && socketOpened) defaultDetail = "AISStream socket opened but the subscription was not confirmed";
      resolve({
        generatedAt: new Date().toISOString(),
        vessels: list,
        health: {
          ok,
          detail: detail ?? defaultDetail,
          source: "AISStream"
        }
      });
    };

    const timer = setTimeout(() => finish(), SAMPLE_MS);

    try {
      socket = new WebSocket(AISSTREAM_URL, { perMessageDeflate: true });
      socket.on("open", () => {
        socketOpened = true;
        socket?.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: FORT_MADISON_BBOX,
          FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport"]
        }));
      });
      socket.on("message", (raw: RawData) => {
        try {
          const payload = JSON.parse(raw.toString());
          if (payload?.MessageType === "SubscriptionConfirmation") {
            subscriptionConfirmed = true;
            return;
          }
          const vessel = normalizeAisStreamMessage(payload);
          if (vessel) vessels.set(vessel.mmsi, vessel);
        } catch {}
      });
      socket.on("error", error => finish(`AISStream connection error: ${error.message}`, false));
      socket.on("close", (code, reason) => {
        if (!settled && !subscriptionConfirmed) finish(`AISStream closed before subscription confirmation (${code}${reason ? `: ${reason.toString()}` : ""})`, false);
      });
    } catch (error) {
      finish(`AISStream setup failed: ${error instanceof Error ? error.message : "unknown error"}`, false);
    }
  });
}

async function loadAisSnapshot(): Promise<AisSnapshot> {
  const configuredFeed = await fromHttpFeed();
  if (configuredFeed) return configuredFeed;

  const apiKey = process.env.AISSTREAM_API_KEY?.trim();
  if (!apiKey) {
    return {
      generatedAt: new Date().toISOString(),
      vessels: [],
      health: {
        ok: false,
        detail: "AIS integration is ready; add AISSTREAM_API_KEY on the server to turn on live vessel positions",
        source: "AISStream"
      }
    };
  }
  return fromAisStream(apiKey);
}

export async function getAisSnapshot(): Promise<AisSnapshot> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.value;
  if (inFlight) return inFlight;

  inFlight = loadAisSnapshot().then(value => {
    const capturedAt = Date.now();
    if (value.vessels.length) {
      lastNonEmpty = { at: capturedAt, value };
    } else if (value.health.ok && lastNonEmpty && capturedAt - lastNonEmpty.at < RECENT_HOLD_MS) {
      const ageMin = Math.max(1, Math.round((capturedAt - lastNonEmpty.at) / 60_000));
      value = {
        ...lastNonEmpty.value,
        generatedAt: new Date().toISOString(),
        health: {
          ok: true,
          source: lastNonEmpty.value.health.source,
          detail: `No new position report in the current sample; showing ${lastNonEmpty.value.vessels.length} recent AIS vessel${lastNonEmpty.value.vessels.length === 1 ? "" : "s"} captured about ${ageMin} min ago`
        }
      };
    }
    cached = { at: capturedAt, value };
    return value;
  }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}