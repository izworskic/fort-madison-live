import type { RiverObservation } from "../types";

const URL = "https://api.water.noaa.gov/nwps/v1/gauges/FMDI4/stageflow/observed";

function n(v: unknown): number | null { const x = Number(v); return Number.isFinite(x) ? x : null; }

export async function getRiverObservation(): Promise<RiverObservation> {
  const retrievedAt = new Date().toISOString();
  try {
    const res = await fetch(URL, { headers: { "User-Agent": "FortMadisonLive/0.1 (public river interpretation tool)" }, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`NWPS ${res.status}`);
    const json: any = await res.json();
    const points = Array.isArray(json?.data) ? json.data : Array.isArray(json?.observed?.data) ? json.observed.data : [];
    const valid = points.filter((p:any)=>n(p?.primary ?? p?.value ?? p?.stage) !== null);
    const latest = valid.at(-1);
    const latestValue = n(latest?.primary ?? latest?.value ?? latest?.stage);
    const target = latest ? new Date(latest.validTime ?? latest.time ?? latest.timestamp ?? retrievedAt).getTime() - 24*3600*1000 : 0;
    let old = null;
    if (valid.length && target) old = valid.reduce((best:any,p:any)=> Math.abs(new Date(p.validTime ?? p.time ?? p.timestamp).getTime()-target) < Math.abs(new Date(best.validTime ?? best.time ?? best.timestamp).getTime()-target) ? p : best, valid[0]);
    const oldValue = n(old?.primary ?? old?.value ?? old?.stage);
    const trend = latestValue !== null && oldValue !== null ? Math.round((latestValue-oldValue)*100)/100 : null;
    return { stageFt: latestValue, trend24hFt: trend, floodStageFt: 528, observedAt: latest ? (latest.validTime ?? latest.time ?? latest.timestamp ?? null) : null,
      provenance: { source:"NOAA/NWS National Water Prediction Service — FMDI4", sourceUrl:"https://water.noaa.gov/gauges/FMDI4", retrievedAt, observedAt:latest ? (latest.validTime ?? latest.time ?? latest.timestamp ?? undefined):undefined, status:"OBSERVED", confidence:"VERY HIGH", note:"Provisional hydrologic observation." } };
  } catch (err:any) {
    return { stageFt:null, trend24hFt:null, floodStageFt:528, observedAt:null,
      provenance:{source:"NOAA/NWS NWPS — FMDI4", sourceUrl:"https://water.noaa.gov/gauges/FMDI4", retrievedAt, status:"UNAVAILABLE", confidence:"UNAVAILABLE", note:String(err?.message ?? err)} };
  }
}
