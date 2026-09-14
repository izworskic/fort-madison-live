"use client";
import { useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot, TrainEvent, TowEvent } from "../lib/types";
import dynamic from "next/dynamic";

const LiveMap=dynamic(()=>import("./LiveMap"),{ssr:false,loading:()=> <div className="map-placeholder">Loading live map…</div>});
const TZ="America/Chicago";
const RAILCAM_ID="mexGMd6-8ik";
const RAILCAM_URL="https://www.youtube.com/live/mexGMd6-8ik?is=kigGABgf73LpV1Oo";

function time(iso?:string){if(!iso)return "—";return new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit"}).format(new Date(iso));}
function countdown(iso?:string){if(!iso)return "";const m=Math.round((new Date(iso).getTime()-Date.now())/60000);if(m<0&&m>-15)return "now";if(m<0)return "passed";if(m<60)return `${m} min`;const h=Math.floor(m/60),r=m%60;return `${h}h ${r}m`;}
function range(a?:string,b?:string,best?:string){if(a&&b&&a!==b)return `${time(a)}–${time(b)}`;return time(best||a||b);}
function trend(v:number|null){if(v===null)return "";return `${v>0?"↑":v<0?"↓":"→"}${Math.abs(v).toFixed(2)}`;}
function ageLabel(iso:string,now:number){const min=Math.max(0,Math.round((now-new Date(iso).getTime())/60000));if(min<2)return "updated just now";if(min<60)return `updated ${min} min ago`;return `updated at ${time(iso)}`;}
function minutesUntil(iso:string|undefined,now:number){if(!iso)return null;return Math.round((new Date(iso).getTime()-now)/60000);}
function track(name:string,params:Record<string,unknown>={}){if(typeof window!=="undefined") (window as any).gtag?.("event",name,params);}
function liveApiUrl(){if(typeof window!=="undefined"&&window.location.pathname.startsWith("/national-tools/fort-madison-live"))return "/national-tools/fort-madison-live/api/live";return "/api/live";}

export default function LiveRefresh({initial}:{initial:DashboardSnapshot}){
  const [data,setData]=useState(initial);
  const [now,setNow]=useState(Date.now());

  useEffect(()=>{track("fort_madison_loaded",{next_event_kind:initial.nextEvent.kind,convergence_state:initial.convergence.state});},[]);
  useEffect(()=>{
    const t=setInterval(()=>setNow(Date.now()),15000);
    const p=setInterval(async()=>{
      try{const r=await fetch(liveApiUrl(),{cache:"no-store"});if(r.ok)setData(await r.json());}catch{}
    },60000);
    return()=>{clearInterval(t);clearInterval(p);};
  },[]);

  const freight=data.trains.filter(t=>t.carrier.toLowerCase()!=="amtrak");
  const amtrak=data.trains.filter(t=>t.carrier.toLowerCase()==="amtrak");
  const next=data.nextEvent;
  const nextCount=useMemo(()=>countdown(next.etaBest),[next.etaBest,now]);
  const mins=minutesUntil(next.etaBest,now);

  let decisionTag="QUIET RIGHT NOW";
  let decisionHeadline="Nothing worth waiting for yet.";
  let decisionText="The engine does not have a reliable train, tow or bridge event close enough to justify sitting on the camera. Check back when a new watch window appears.";

  const hasUsableEvent=next.kind!=="quiet"&&next.etaBest&&mins!==null&&mins>=-15;
  if(hasUsableEvent&&mins!==null){
    if(mins<=10){
      decisionTag="WATCH NOW";
      decisionHeadline="Open the camera now.";
      decisionText=`${next.title} is inside or very near its likely Fort Madison window. The timing is ${next.status.toLowerCase()}, so treat it as a watch window rather than an exact arrival time.`;
    }else if(mins<=45){
      decisionTag="WATCH SOON";
      decisionHeadline=`Check the camera in about ${nextCount}.`;
      decisionText=`${next.title} is the next event the engine thinks is worth watching. You do not need to sit on the stream yet — come back as the window gets close.`;
    }else if(mins<=120){
      decisionTag="COME BACK LATER";
      decisionHeadline=`Come back in about ${nextCount}.`;
      decisionText=`The next useful watch window is ${range(next.etaStart,next.etaEnd,next.etaBest)} for ${next.title}. Nothing in the current data says you need to watch continuously before then.`;
    }else{
      decisionTag="PLAN FOR LATER";
      decisionHeadline=`Next watch window: ${range(next.etaStart,next.etaEnd,next.etaBest)}.`;
      decisionText=`${next.title} is the next identifiable event, but it is still too far away to justify watching now. Use this page again as the window approaches.`;
    }
  }

  const whyTitle=next.kind==="bridge"?"The bridge may be the event.":next.kind==="tow"?"A tow may force the next bridge move.":next.kind==="train"?"A train is the next likely crossing event.":"The crossing is quiet for now.";

  return <>
    <section className="live-status" aria-label="Live engine status">
      <span><i/>ENGINE LIVE</span>
      <b>{ageLabel(data.generatedAt,now)}</b>
      <p>Fort Madison, Iowa · Central Time</p>
    </section>

    <section className="hero-grid" aria-label="Fort Madison watch decision">
      <article className="next-card">
        <div className="eyebrow-row"><span className="pulse"/><span>YOUR WATCH DECISION</span><span className="truth-chip">{decisionTag}</span></div>
        <h2>{decisionHeadline}</h2>
        <p className="hero-sub">{decisionText}</p>
        <div className="eta-row">
          <div><span className="label">NEXT LIKELY EVENT</span><strong>{next.kind==="quiet"?"No reliable event yet":next.title}</strong><small>{next.kind==="quiet"?"The engine is still checking rail and river signals.":next.subtitle}</small></div>
          <div className="countdown"><span>BEST WATCH WINDOW</span><strong>{next.etaBest?range(next.etaStart,next.etaEnd,next.etaBest):"—"}</strong><small>{nextCount&&nextCount!=="passed"?nextCount:""}</small></div>
        </div>
        <div className="confidence"><span>How certain is this?</span><b>{next.confidence} · {next.status}</b></div>
        <div className="camera-links"><a href="#camera" onClick={()=>track("decision_cta",{action:"camera",decision:decisionTag})}>Watch the live camera ↓</a><a href="#map" onClick={()=>track("decision_cta",{action:"map",decision:decisionTag})}>See the crossing map ↓</a></div>
      </article>
      <aside className="convergence-card">
        <span className="label">WHAT THE ENGINE IS WATCHING</span>
        <h2>{whyTitle}</h2>
        <p>Fort Madison is unusual because river traffic and railroad traffic share one moving bridge. A commercial tow can require the swing span to open and temporarily hold rail traffic. The engine looks for those moments so you do not have to interpret several feeds yourself.</p>
        <div className="overlap"><strong>{data.convergence.state}</strong><span>{data.convergence.message}</span></div>
        {data.convergence.overlapProbability!==null&&data.convergence.overlapProbability>0&&<div className="overlap"><strong>{data.convergence.overlapProbability}%</strong><span>modeled rail + river overlap</span></div>}
      </aside>
    </section>

    <section className="section camera-section" id="camera">
      <div className="section-head camera-head"><div><span className="kicker">WATCH THE DECISION PLAY OUT</span><h2>Fort Madison live camera</h2></div><p>The recommendation above tells you whether this stream is worth your time right now. When a watch window approaches, use the camera to see the actual crossing activity.</p></div>
      <div className="camera-grid">
        <div className="video-shell">
          <div className="video-top"><span><i/>LIVE CAMERA</span><small>Fort Madison · YouTube Live</small></div>
          <div className="video-frame"><iframe src={`https://www.youtube.com/embed/${RAILCAM_ID}?rel=0&playsinline=1`} title="Fort Madison live camera" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
          <div className="video-credit">Live stream via the publisher’s official YouTube player. Video availability and rights remain with the stream publisher.</div>
        </div>
        <aside className="watch-card">
          <span className="label">WHAT SHOULD I DO?</span>
          <h3>{decisionHeadline}</h3>
          <strong>{next.kind==="quiet"?"No reliable event close enough yet":next.title}</strong>
          <p>{next.etaBest?`${range(next.etaStart,next.etaEnd,next.etaBest)} · ${nextCount}`:"The engine will surface a watch window when it has one."}</p>
          <div className="watch-cues"><span>1</span><p><b>Watching remotely?</b> Follow the recommendation above instead of leaving the stream open all day.</p><span>2</span><p><b>Already at the riverfront?</b> Use the next-event window to know what movement to look for.</p><span>3</span><p><b>Want the evidence?</b> The live conditions, map and source-health sections below show what the engine is using.</p></div>
          <div className="camera-links"><a href={RAILCAM_URL} target="_blank" rel="noreferrer" onClick={()=>track("camera_external_click",{provider:"youtube"})}>Open this live camera on YouTube ↗</a></div>
        </aside>
      </div>
    </section>

    <section className="quick-grid" aria-label="Engine evidence">
      <div><span>River stage</span><strong>{data.river.stageFt!==null?`${data.river.stageFt.toFixed(2)} ft`:"Unavailable"}</strong><small>{trend(data.river.trend24hFt)} 24 hr · flood {data.river.floodStageFt??"—"} ft</small></div>
      <div><span>Tow candidates</span><strong>{data.tows.length}</strong><small>named movements from Locks 18 / 19</small></div>
      <div><span>Identified freight</span><strong>{freight.length||"—"}</strong><small>{freight.length?"observed by configured source":"live provider not connected"}</small></div>
      <div><span>Next Amtrak</span><strong>{amtrak[0]?countdown(amtrak[0].etaBest):"—"}</strong><small>{amtrak[0]?.displayId||"Southwest Chief"}</small></div>
    </section>

    <section className="section map-section" id="map">
      <div className="section-head"><div><span className="kicker">WHY THE TIMING WORKS</span><h2>See the crossing the engine is modeling</h2></div><p>The bridge is the decision point. Observed train and tow positions appear only when a configured source actually reports them; predictions are never drawn as fake GPS positions.</p></div>
      <LiveMap data={data}/>
    </section>

    <section className="two-col section activity-section">
      <div><div className="section-head compact"><div><span className="kicker">RAIL</span><h2>Coming to Fort Madison</h2></div></div><div className="event-list">{data.trains.slice(0,6).map((t:TrainEvent)=><article className="event-row" key={t.id}><div className="event-icon rail-icon">R</div><div><div className="event-title"><strong>{t.displayId}</strong><span className="truth-chip">{t.status}</span></div><p>{t.type} · {t.direction}</p><small>{t.lastObservedLabel?`Last observed: ${t.lastObservedLabel}${t.lastObservedAt?` · ${time(t.lastObservedAt)}`:""}`:t.note}</small></div><div className="event-time"><strong>{range(t.etaStart,t.etaEnd,t.etaBest)}</strong><span>{countdown(t.etaBest)}</span></div></article>)}</div></div>
      <div><div className="section-head compact"><div><span className="kicker">RIVER</span><h2>Commercial tows</h2></div></div><div className="event-list">{data.tows.length?data.tows.slice(0,6).map((t:TowEvent)=><article className="event-row" key={t.id}><div className="event-icon tow-icon">V</div><div><div className="event-title"><strong>{t.vesselName}</strong><span className="truth-chip">{t.status}</span></div><p>{t.direction}{t.barges?` · ${t.barges} barges`:""} · Lock {t.sourceLock}</p><small>{t.note}</small></div><div className="event-time"><strong>{range(t.etaStart,t.etaEnd,t.etaBest)}</strong><span>bridge approach</span></div></article>):<div className="empty-state"><strong>No named tow is currently inside the lock-derived prediction window.</strong><p>The engine is still checking both adjacent Corps lock feeds. Come back as a tow enters the corridor.</p></div>}</div></div>
    </section>

    <section className="section truth-section">
      <details className="truth-details">
        <summary><div><span className="kicker">DATA STATUS</span><strong>What is observed, predicted or unavailable?</strong></div><span className="summary-action">View source health +</span></summary>
        <div className="health-grid">{(Object.entries(data.health) as [string,{ok:boolean;detail:string;observedAt?:string}][]).map(([k,v])=><div key={k} className={v.ok?"health ok":"health degraded"}><span>{k}</span><strong>{v.ok?"AVAILABLE":"DEGRADED"}</strong><p>{v.detail}</p></div>)}</div>
      </details>
    </section>
  </>;
}
