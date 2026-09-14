"use client";
import { useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot, TrainEvent, TowEvent } from "../lib/types";
import dynamic from "next/dynamic";

const LiveMap=dynamic(()=>import("./LiveMap"),{ssr:false,loading:()=> <div className="map-placeholder">Loading crossing map…</div>});
const TZ="America/Chicago";
const RAILCAM_ID="mexGMd6-8ik";
const RAILCAM_URL="https://www.youtube.com/live/mexGMd6-8ik?is=kigGABgf73LpV1Oo";
const VISIT_KEY="fort-madison-watch-state-v2";

type VisitState={at:number;bridgePercent:number|null;bestTitle:string;bestStart:string|null};

function time(iso?:string|null){if(!iso)return "—";return new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit"}).format(new Date(iso));}
function countdown(iso?:string|null,now=Date.now()){if(!iso)return "";const m=Math.round((new Date(iso).getTime()-now)/60000);if(m<0&&m>-15)return "now";if(m<0)return "passed";if(m<60)return `${m} min`;const h=Math.floor(m/60),r=m%60;return r?`${h}h ${r}m`:`${h}h`;}
function range(a?:string|null,b?:string|null,best?:string|null){if(a&&b&&a!==b)return `${time(a)}–${time(b)}`;return time(best||a||b);}
function trend(v:number|null){if(v===null)return "";return `${v>0?"↑":v<0?"↓":"→"}${Math.abs(v).toFixed(2)}`;}
function ageLabel(iso:string,now:number){const min=Math.max(0,Math.round((now-new Date(iso).getTime())/60000));if(min<2)return "updated just now";if(min<60)return `updated ${min} min ago`;return `updated at ${time(iso)}`;}
function minutesUntil(iso:string|undefined|null,now:number){if(!iso)return null;return Math.round((new Date(iso).getTime()-now)/60000);}
function track(name:string,params:Record<string,unknown>={}){if(typeof window!=="undefined") (window as any).gtag?.("event",name,params);}
function liveApiUrl(){if(typeof window!=="undefined"&&window.location.pathname.startsWith("/national-tools/fort-madison-live"))return "/national-tools/fort-madison-live/api/live";return "/api/live";}

export default function LiveRefresh({initial}:{initial:DashboardSnapshot}){
  const [data,setData]=useState(initial);
  const [now,setNow]=useState(Date.now());
  const [previousVisit,setPreviousVisit]=useState<VisitState|null>(null);

  useEffect(()=>{track("fort_madison_loaded",{next_event_kind:initial.nextEvent.kind,convergence_state:initial.convergence.state,best_watch_kind:initial.watchSummary.bestWindow.kind});},[]);
  useEffect(()=>{
    const t=setInterval(()=>setNow(Date.now()),15000);
    const p=setInterval(async()=>{
      try{const r=await fetch(liveApiUrl(),{cache:"no-store"});if(r.ok)setData(await r.json());}catch{}
    },60000);
    return()=>{clearInterval(t);clearInterval(p);};
  },[]);
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(VISIT_KEY);
      if(raw){
        const parsed=JSON.parse(raw) as VisitState;
        if(parsed?.at&&Date.now()-parsed.at>2*60000)setPreviousVisit(parsed);
      }
      const current:VisitState={at:Date.now(),bridgePercent:initial.watchSummary.bridgeOpening.percent,bestTitle:initial.watchSummary.bestWindow.title,bestStart:initial.watchSummary.bestWindow.start};
      const save=setTimeout(()=>localStorage.setItem(VISIT_KEY,JSON.stringify(current)),2500);
      return()=>clearTimeout(save);
    }catch{}
  },[]);

  const freight=data.trains.filter(t=>t.carrier.toLowerCase()!=="amtrak");
  const amtrak=data.trains.filter(t=>t.carrier.toLowerCase()==="amtrak");
  const futureTows=[...data.tows].filter(t=>t.etaBest&&new Date(t.etaBest).getTime()>=now-15*60000).sort((a,b)=>new Date(a.etaBest!).getTime()-new Date(b.etaBest!).getTime());
  const futureAmtrak=[...amtrak].filter(t=>t.etaBest&&new Date(t.etaBest).getTime()>=now-15*60000).sort((a,b)=>new Date(a.etaBest!).getTime()-new Date(b.etaBest!).getTime());
  const nextTow=futureTows[0];
  const nextAmtrak=futureAmtrak[0];
  const bridge=data.watchSummary.bridgeOpening;
  const bestWatch=data.watchSummary.bestWindow;

  const timeline=useMemo(()=>{
    const rows:(
      {id:string;kind:"train"|"tow";title:string;subtitle:string;eta?:string;start?:string;end?:string;status:string;confidence:string;note?:string}
    )[]=[];
    for(const t of data.trains){
      if(!t.etaBest||new Date(t.etaBest).getTime()<now-15*60000)continue;
      rows.push({id:t.id,kind:"train",title:t.displayId,subtitle:`${t.type} · ${t.direction}`,eta:t.etaBest,start:t.etaStart,end:t.etaEnd,status:t.status,confidence:t.confidence,note:t.note});
    }
    for(const t of data.tows){
      if(!t.etaBest||new Date(t.etaBest).getTime()<now-15*60000)continue;
      rows.push({id:t.id,kind:"tow",title:t.vesselName,subtitle:`${t.direction}${t.barges?` · ${t.barges} barges`:""} · bridge-opening candidate`,eta:t.etaBest,start:t.bridgeOpenStart||t.etaStart,end:t.bridgeOpenEnd||t.etaEnd,status:t.status,confidence:t.confidence,note:t.note});
    }
    return rows.sort((a,b)=>new Date(a.eta||0).getTime()-new Date(b.eta||0).getTime()).slice(0,6);
  },[data,now]);

  const bridgeWindow=range(bridge.start,bridge.end,bridge.best);
  const bridgeHeadline=bridge.percent===null?"No current bridge-opening signal.":`${bridge.percent}% · ${bridge.label.toLowerCase()} opening likelihood`;
  const bridgeCopy=bridge.percent===null
    ?"No named tow is currently inside the modeled Fort Madison corridor, so the engine will not invent a probability."
    :`${bridge.vesselName} is the active bridge-opening candidate. ${bridge.reasons.join(" · ")}. This is a model likelihood, not an official BNSF opening schedule.`;

  const overlap=data.convergence.overlapProbability;
  const overlapHeadline=overlap!==null&&overlap>=75?"High-interest river + rail overlap":overlap!==null&&overlap>=55?"Possible river + rail overlap":"No strong overlap right now";
  const checkBackNow=bestWatch.checkBackAt?minutesUntil(bestWatch.checkBackAt,now):null;
  const checkBackLabel=checkBackNow!==null&&checkBackNow<=1?"Watch now":`Check back ${time(bestWatch.checkBackAt)}`;

  let returnHeadline="Your next visit will be smarter.";
  let returnCopy=`This browser will remember today's watch state. When you return, this row will tell you whether the opening signal or best watch window changed.`;
  if(previousVisit){
    const oldPct=previousVisit.bridgePercent;
    const newPct=bridge.percent;
    const changedWindow=previousVisit.bestTitle!==bestWatch.title||previousVisit.bestStart!==bestWatch.start;
    if(oldPct!==null&&newPct!==null&&Math.abs(newPct-oldPct)>=8){
      const direction=newPct>oldPct?"strengthened":"weakened";
      returnHeadline=`Bridge signal ${direction} since your last visit.`;
      returnCopy=`It moved from ${oldPct}% to ${newPct}%. Your previous visit was around ${time(new Date(previousVisit.at).toISOString())}.`;
    }else if(changedWindow){
      returnHeadline="The best watch window changed since your last visit.";
      returnCopy=`It was ${previousVisit.bestTitle}; now the engine prefers ${bestWatch.title}. ${checkBackLabel}.`;
    }else{
      returnHeadline="No major change since your last visit.";
      returnCopy=`The same event still leads the board. ${checkBackLabel}. Last visit: ${time(new Date(previousVisit.at).toISOString())}.`;
    }
  }

  return <>
    <section className="live-status" aria-label="Live engine status">
      <span><i/>WATCH ENGINE LIVE</span>
      <b>{ageLabel(data.generatedAt,now)}</b>
      <p>Fort Madison · Central Time</p>
    </section>

    <section className="section watch-section" id="watch">
      <div className="section-head watch-heading"><div><span className="kicker">TODAY’S FORT MADISON PLAN</span><h2>Know the best time to watch before you wait.</h2></div><p>The engine ranks today’s identifiable bridge, train and river-plus-rail events, then tells you which window is actually worth your time.</p></div>

      <article className="next-card">
        <div className="eyebrow-row"><span className="pulse"/><span>BEST WATCH WINDOW TODAY</span><span className="truth-chip">{bestWatch.label}</span></div>
        <h2>{bestWatch.title}</h2>
        <p className="hero-sub">{bestWatch.reason}</p>
        <div className="eta-row">
          <div><span className="label">BEST WINDOW</span><strong>{range(bestWatch.start,bestWatch.end,bestWatch.best)}</strong><small>{bestWatch.confidence.toLowerCase()} confidence</small></div>
          <div className="countdown"><span>YOUR NEXT MOVE</span><strong>{checkBackLabel}</strong><small>{bestWatch.checkBackAt&&checkBackNow!==null&&checkBackNow>1?`${countdown(bestWatch.checkBackAt,now)} from now`:"camera is worth checking"}</small></div>
        </div>
        <div className="confidence"><span>Why this wins today</span><b>{bestWatch.kind==="convergence"?"River + rail overlap outranks a single-system event":bestWatch.kind==="bridge"?"A modeled bridge opening outranks routine train watching":bestWatch.kind==="train"?"Best identifiable movement currently available":"No stronger event is currently identifiable"}</b></div>
      </article>

      <div className="watch-board">
        <article className="bridge-watch-panel">
          <div className="watch-panel-top"><span className="pulse"/><b>BRIDGE OPENING LIKELIHOOD</b><span className="truth-chip">{bridge.status}</span></div>
          <h3>{bridgeHeadline}</h3>
          <p>{bridgeCopy}</p>
          <div className="bridge-window-row"><div><span>LIKELY OPENING WINDOW</span><strong>{bridgeWindow}</strong><small>{bridge.percent===null?"waiting for a named tow signal":`${bridge.label.toLowerCase()} model signal`}</small></div><div><span>ACTIVE TOW</span><strong>{bridge.vesselName||"None in corridor"}</strong><small>{bridge.sourceLock?`last corridor signal: Lock ${bridge.sourceLock}`:"Locks 18 + 19 are still being checked"}</small></div></div>
          {bridge.reasons.length>0&&<div className="confidence"><span>Why the likelihood is here</span><b>{bridge.reasons.join(" · ")}</b></div>}
          <div className="watch-actions"><a href="#camera" onClick={()=>track("watch_board_click",{target:"camera",likelihood:bridge.percent})}>Watch live camera ↓</a><a href="#map" onClick={()=>track("watch_board_click",{target:"map",likelihood:bridge.percent})}>See approach map ↓</a></div>
        </article>

        <div className="watch-rail">
          <article className="signal-row">
            <span className="signal-icon">A</span>
            <div><span className="label">NEXT SOUTHWEST CHIEF</span><strong>{nextAmtrak?nextAmtrak.displayId:"No timed Amtrak event"}</strong><p>{nextAmtrak?`${range(nextAmtrak.etaStart,nextAmtrak.etaEnd,nextAmtrak.etaBest)} · ${countdown(nextAmtrak.etaBest,now)}`:"Waiting for the next usable passenger-train time."}</p></div>
          </article>
          <article className="signal-row">
            <span className="signal-icon">×</span>
            <div><span className="label">RIVER + RAIL COLLISION WATCH</span><strong>{overlapHeadline}</strong><p>{overlap!==null?`${overlap}% modeled overlap · ${data.convergence.message}`:data.convergence.message}</p></div>
          </article>
          <article className="signal-row">
            <span className="signal-icon">↻</span>
            <div><span className="label">SINCE YOUR LAST VISIT</span><strong>{returnHeadline}</strong><p>{returnCopy}</p></div>
          </article>
        </div>
      </div>
    </section>

    <section className="section camera-section" id="camera">
      <div className="section-head camera-head"><div><span className="kicker">LIVE FORT MADISON CAMERA</span><h2>Watch when the board gives you a reason.</h2></div><p>{bestWatch.kind==="quiet"?"There is no strong identified watch window yet. You can still watch live, but the engine is telling you there is no reason to wait.":`${bestWatch.title} is today’s leading watch event. ${checkBackLabel}.`}</p></div>
      <div className="camera-stage">
        <div className="video-shell">
          <div className="video-top"><span><i/>LIVE CAMERA</span><small>Fort Madison · YouTube Live</small></div>
          <div className="video-frame"><iframe src={`https://www.youtube.com/embed/${RAILCAM_ID}?rel=0&playsinline=1`} title="Fort Madison live camera" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
          <div className="video-credit">Live stream via the publisher’s official YouTube player. Video availability and rights remain with the stream publisher.</div>
        </div>
        <div className="camera-context"><strong>{bridge.percent===null?"NO BRIDGE SIGNAL":`${bridge.percent}% ${bridge.label}`}</strong><span>{bridge.vesselName?`${bridge.vesselName} · ${bridgeWindow}`:"No modeled bridge opening close enough yet."}</span><a href={RAILCAM_URL} target="_blank" rel="noreferrer" onClick={()=>track("camera_external_click",{provider:"youtube"})}>Open stream on YouTube ↗</a></div>
      </div>
    </section>

    <section className="section timeline-section" id="today">
      <div className="section-head"><div><span className="kicker">WHAT’S NEXT</span><h2>Fort Madison watch timeline</h2></div><p>This is the engine’s short list of identifiable events, ordered by likely arrival. Tow rows use modeled bridge-opening windows; train rows use the best available train timing.</p></div>
      <div className="watch-timeline">
        {timeline.length?timeline.map((e,i)=><article className="timeline-row" key={e.id}>
          <div className={`timeline-kind ${e.kind}`}>{e.kind==="tow"?"BRIDGE":"TRAIN"}</div>
          <div className="timeline-main"><span>{i===0?"NEXT":"LATER"}</span><strong>{e.title}</strong><p>{e.subtitle}</p></div>
          <div className="timeline-window"><span>WATCH WINDOW</span><strong>{range(e.start,e.end,e.eta)}</strong><small>{countdown(e.eta,now)} · {e.confidence.toLowerCase()} confidence</small></div>
        </article>):<div className="empty-state"><strong>No identifiable event is currently inside the watch horizon.</strong><p>That is useful information too. The page will populate as train timing or named tow observations produce a defensible window.</p></div>}
      </div>
    </section>

    <section className="engine-evidence section" aria-label="Engine evidence">
      <div className="section-head compact"><div><span className="kicker">WHAT THE ENGINE SEES</span><h2>Signals behind the watch board</h2></div></div>
      <div className="quick-grid evidence-grid">
        <div><span>River stage</span><strong>{data.river.stageFt!==null?`${data.river.stageFt.toFixed(2)} ft`:"Unavailable"}</strong><small>{trend(data.river.trend24hFt)} 24 hr · flood {data.river.floodStageFt??"—"} ft</small></div>
        <div><span>Tow candidates</span><strong>{data.tows.length}</strong><small>named movements from Locks 18 / 19</small></div>
        <div><span>Identified freight</span><strong>{freight.length||"—"}</strong><small>{freight.length?"reported by configured source":"live identity provider not connected"}</small></div>
        <div><span>Next Amtrak</span><strong>{nextAmtrak?countdown(nextAmtrak.etaBest,now):"—"}</strong><small>{nextAmtrak?.displayId||"Southwest Chief"}</small></div>
      </div>
    </section>

    <section className="section map-section" id="map">
      <div className="section-head"><div><span className="kicker">THE CROSSING</span><h2>See why an upstream tow matters here.</h2></div><p>The map centers the moving bridge and rail corridor, then adds observed train/tow positions only when a configured source actually reports them.</p></div>
      <LiveMap data={data}/>
    </section>

    <section className="section truth-section">
      <details className="truth-details">
        <summary><div><span className="kicker">DATA STATUS</span><strong>What is observed, estimated or unavailable?</strong></div><span className="summary-action">View source health +</span></summary>
        <div className="health-grid">{(Object.entries(data.health) as [string,{ok:boolean;detail:string;observedAt?:string}][]).map(([k,v])=><div key={k} className={v.ok?"health ok":"health degraded"}><span>{k}</span><strong>{v.ok?"AVAILABLE":"DEGRADED"}</strong><p>{v.detail}</p></div>)}</div>
      </details>
    </section>
  </>;
}
