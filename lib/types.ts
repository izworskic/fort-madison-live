export type EvidenceStatus = "OBSERVED" | "OFFICIAL" | "SCHEDULED" | "INFERRED" | "ESTIMATED" | "HISTORICAL" | "UNAVAILABLE";
export type Confidence = "VERY HIGH" | "HIGH" | "MODERATE" | "LOW" | "UNAVAILABLE";

export interface Provenance {
  source: string;
  sourceUrl?: string;
  observedAt?: string;
  retrievedAt: string;
  status: EvidenceStatus;
  confidence: Confidence;
  note?: string;
}

export interface RiverObservation {
  stageFt: number | null;
  trend24hFt: number | null;
  floodStageFt: number | null;
  observedAt: string | null;
  provenance: Provenance;
}

export interface TrainEvent {
  id: string;
  carrier: string;
  displayId: string;
  trainNumber?: string;
  direction: "eastbound" | "westbound" | "unknown";
  type: string;
  etaStart?: string;
  etaBest?: string;
  etaEnd?: string;
  lastObservedAt?: string;
  lastObservedLabel?: string;
  lat?: number;
  lon?: number;
  confidence: Confidence;
  status: EvidenceStatus;
  note?: string;
}

export interface TowEvent {
  id: string;
  vesselName: string;
  vesselNumber?: string;
  direction: "northbound" | "southbound" | "unknown";
  barges: number | null;
  sourceLock: "18" | "19" | "AIS" | "unknown";
  lastObservedAt?: string;
  etaStart?: string;
  etaBest?: string;
  etaEnd?: string;
  bridgeOpenStart?: string;
  bridgeOpenEnd?: string;
  confidence: Confidence;
  status: EvidenceStatus;
  lat?: number;
  lon?: number;
  note?: string;
}

export interface NoticeItem { id: string; title: string; url?: string; date?: string; }

export interface DashboardSnapshot {
  generatedAt: string;
  river: RiverObservation;
  trains: TrainEvent[];
  tows: TowEvent[];
  notices: NoticeItem[];
  nextEvent: {
    kind: "train" | "tow" | "bridge" | "quiet";
    title: string;
    subtitle: string;
    etaBest?: string;
    etaStart?: string;
    etaEnd?: string;
    confidence: Confidence;
    status: EvidenceStatus;
    watchLabel: string;
  };
  convergence: {
    state: "QUIET" | "ACTIVE" | "VERY ACTIVE" | "CONVERGENCE EVENT";
    message: string;
    overlapProbability: number | null;
  };
  watchSummary: {
    bridgeOpening: {
      percent: number | null;
      label: "HIGH" | "ELEVATED" | "MODERATE" | "LOW" | "NO CURRENT SIGNAL";
      reasons: string[];
      vesselName: string | null;
      start: string | null;
      best: string | null;
      end: string | null;
      sourceLock: "18" | "19" | "AIS" | "unknown" | null;
      confidence: Confidence;
      status: EvidenceStatus;
    };
    bestWindow: {
      kind: "bridge" | "train" | "convergence" | "quiet";
      title: string;
      start: string | null;
      best: string | null;
      end: string | null;
      score: number;
      label: string;
      reason: string;
      confidence: Confidence;
      checkBackAt: string;
    };
  };
  health: Record<string, { ok: boolean; detail: string; observedAt?: string }>;
}
