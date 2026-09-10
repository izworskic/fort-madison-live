"use client";
import { useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot, TrainEvent, TowEvent } from "../lib/types";
import dynamic from "next/dynamic";
const LiveMap=dynamic(()=>import("./LiveMap"),{ssr:false,loading:()=> <div className="map-placeholder">Loading live map…</div>});

const TZ="America/Chicago";
function time(iso?:string){if(!iso)return "—";return new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit"}).format(new Date(iso));}
function countdown(iso?:string){if(!iso)return "";const m=Math.round((new Date(iso).getTime()-Date.now())/60000); if(m<0&&m>-15)return "now"; if(m<0)return "passed"; if(m<60)return `${m} min`;const h=Math.floor(m/60),r=m%60;return `${h}h ${r}m`;}
function range(a?:string,b?:string,best?:string){if(a&&b&&a!==b)return `${time(a)}–${time(b)}`;return time(best||a||b);}
function trend(v:number|null){if(v===null)return "";return `${v>0?"↑":v<0?"↓":"→"}${Math.abs(v).toFixed(2)}`;}

function track(name:string,params:Record<string,unknown>={}){if(typeof window!=="undefined") (window as any).gtag?.("event",name,params);}

export default function LiveRefresh({initial}:{initial:DashboardSnapshot}){
  const [data,setData]=useState(initial); const [now,setNow]=useState(Date.now());
  useEffect(()=>{track("fort_madison_loaded",{next_event_kind:initial.nextEvent.kind,convergence_state:initial.convergence.state});},[]);
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),15000); const p=setInterval(async()=>{try{const r=await fetch("/api/live",{cache:"no-store"});if(r.ok)setData(await r.json());}catch{}},60000);return()=>{clearInterval(t);clearInterval(p);};},[]);
  const freight=data.trains.filter(t=>t.carrier.toLowerCase()!=="amtrak"); const amtrak=data.trains.filter(t=>t.carrier.toLowerCase()==="amtrak");
  const next=data.nextEvent; const nextCount=useMemo(()=>countdown(next.etaBest),[next.etaBest,now]);
  return <>
    <section className="hero-grid">
      <article className="next-card">
        <div className="eyebrow-row"><span className="pulse"/><span>{next.watchLabel}</span><span className="truth-chip">{next.status}</span></div>
        <h1>{next.title}</h1><p className="hero-sub">{next.subtitle}</p>
        {next.etaBest && <div className="eta-row"><div><span className="label">FORT MADISON WINDOW</span><strong>{range(next.etaStart,next.etaEnd,next.etaBest)}</strong></div><div className="countdown"><span>ABOUT</span><strong>{nextCount}</strong></div></div>}
        <div className="confidence"><span>Confidence</span><b>{next.confidence}</b></div>
      </article>
      <aside className="convergence-card">
        <span className="label">WHAT TO WATCH</span><h2>{data.convergence.state}</h2><p>{data.convergence.message}</p>
        {data.convergence.overlapProbability!==null && data.convergence.overlapProbability>0 && <div className="overlap"><strong>{data.convergence.overlapProbability}%</strong><span>modeled window overlap</span></div>}
      </aside>
    </section>
    <section className="quick-grid" aria-label="Live conditions">
      <div><span>River stage</span><strong>{data.river.stageFt!==null?`${data.river.stageFt.toFixed(2)} ft`:"Unavailable"}</strong><small>{trend(data.river.trend24hFt)} 24 hr · flood {data.river.floodStageFt??"—"} ft</small></div>
      <div><span>Named tow candidates</span><strong>{data.tows.length}</strong><small>from Locks 18 / 19</small></div>
      <div><span>Identified freight</span><strong>{freight.length || "—"}</strong><small>{freight.length?"licensed/partner feed":"provider not connected"}</small></div>
      <div><span>Next Amtrak</span><strong>{amtrak[0]?countdown(amtrak[0].etaBest):"—"}</strong><small>{amtrak[0]?.displayId||"Southwest Chief"}</small></div>
    </section>
    <section className="section map-section"><div className="section-head"><div><span className="kicker">THE CROSSING</span><h2>River + rail, one live map</h2></div><p>Markers appear only when their position is observed by a configured source. Predicted movement is never drawn as GPS.</p></div><LiveMap data={data}/></section>
    <section className="two-col section">
      <div><div className="section-head compact"><div><span className="kicker">RAIL</span><h2>Coming to Fort Madison</h2></div></div><div className="event-list">{data.trains.slice(0,8).map((t:TrainEvent)=><article className="event-row" key={t.id}><div className="event-icon">↔</div><div><div className="event-title"><strong>{t.displayId}</strong><span className="truth-chip">{t.status}</span></div><p>{t.type} · {t.direction}</p><small>{t.lastObservedLabel?`Last observed: ${t.lastObservedLabel}${t.lastObservedAt?` · ${time(t.lastObservedAt)}`:""}`:t.note}</small></div><div className="event-time"><strong>{range(t.etaStart,t.etaEnd,t.etaBest)}</strong><span>{countdown(t.etaBest)}</span></div></article>)}</div></div>
      <div><div className="section-head compact"><div><span className="kicker">RIVER</span><h2>Commercial tows</h2></div></div><div className="event-list">{data.tows.length?data.tows.slice(0,8).map((t:TowEvent)=><article className="event-row" key={t.id}><div className="event-icon">⌁</div><div><div className="event-title"><strong>{t.vesselName}</strong><span className="truth-chip">{t.status}</span></div><p>{t.direction}{t.barges?` · ${t.barges} barges`:""} · Lock {t.sourceLock}</p><small>{t.note}</small></div><div className="event-time"><strong>{range(t.etaStart,t.etaEnd,t.etaBest)}</strong><span>bridge approach</span></div></article>):<div className="empty-state"><strong>No named tow is currently inside the lock-derived prediction window.</strong><p>The app is still checking both adjacent Corps Locks feeds.</p></div>}</div></div>
    </section>
    <section className="section truth-section"><div className="section-head"><div><span className="kicker">TRUST LAYER</span><h2>What is observed vs. predicted</h2></div></div><div className="health-grid">{(Object.entries(data.health) as [string,{ok:boolean;detail:string;observedAt?:string}][]).map(([k,v])=><div key={k} className={v.ok?"health ok":"health degraded"}><span>{k}</span><strong>{v.ok?"AVAILABLE":"DEGRADED"}</strong><p>{v.detail}</p></div>)}</div></section>
  </>;
}
