"use client";
import { useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot, TrainEvent, TowEvent } from "../lib/types";
import dynamic from "next/dynamic";

const LiveMap=dynamic(()=>import("./LiveMap"),{ssr:false,loading:()=> <div className="map-placeholder">Loading crossing map…</div>});
const TZ="America/Chicago";
const RAILCAM_ID="mexGMd6-8ik";
const RAILCAM_URL="https://www.youtube.com/live/mexGMd6-8ik?is=kigGABgf73LpV1Oo";

function time(iso?:string){if(!iso)return "—";return new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit"}).format(new Date(iso));}
function countdown(iso?:string,now=Date.now()){if(!iso)return "";const m=Math.round((new Date(iso).getTime()-now)/60000);if(m<0&&m>-15)return "now";if(m<0)return "passed";if(m<60)return `${m} min`;const h=Math.floor(m/60),r=m%60;return r?`${h}h ${r}m`:`${h}h`;}
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
  const futureTows=[...data.tows].filter(t=>t.etaBest&&new Date(t.etaBest).getTime()>=now-15*60000).sort((a,b)=>new Date(a.etaBest!).getTime()-new Date(b.etaBest!).getTime());
  const futureAmtrak=[...amtrak].filter(t=>t.etaBest&&new Date(t.etaBest).getTime()>=now-15*60000).sort((a,b)=>new Date(a.etaBest!).getTime()-new Date(b.etaBest!).getTime());
  const nextTow=futureTows[0];
  const nextAmtrak=futureAmtrak[0];

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

  let bridgeTag="NO OPENING CANDIDATE YET";
  let bridgeHeadline="No lock-derived bridge opening is close enough to call.";
  let bridgeCopy="The engine is still checking commercial tow movements at Locks 18 and 19. When a named tow enters the Fort Madison corridor, this becomes a watch window instead of a blank railcam wait.";
  let bridgeWindow="—";
  if(nextTow){
    bridgeWindow=range(nextTow.bridgeOpenStart||nextTow.etaStart,nextTow.bridgeOpenEnd||nextTow.etaEnd,nextTow.etaBest);
    const m=minutesUntil(nextTow.bridgeOpenStart||nextTow.etaBest,now);
    if(m!==null&&m<=10){bridgeTag="BRIDGE WATCH NOW";bridgeHeadline=`${nextTow.vesselName} is entering its modeled bridge window.`;}
    else if(m!==null&&m<=60){bridgeTag="BRIDGE WATCH SOON";bridgeHeadline=`A likely opening window is approaching in about ${countdown(nextTow.bridgeOpenStart||nextTow.etaBest,now)}.`;}
    else{bridgeTag="NEXT BRIDGE WATCH";bridgeHeadline=`Next modeled opening window: ${bridgeWindow}.`;}
    bridgeCopy=`${nextTow.vesselName} was observed in the commercial navigation system at Lock ${nextTow.sourceLock}. The engine projects that movement toward Fort Madison; this is an estimate, not an official BNSF opening schedule.`;
  }

  const overlap=data.convergence.overlapProbability;
  const overlapHeadline=overlap!==null&&overlap>=75?"High-interest river + rail overlap":overlap!==null&&overlap>=55?"Possible river + rail overlap":"No strong overlap right now";

  return <>
    <section className="live-status" aria-label="Live engine status">
      <span><i/>WATCH ENGINE LIVE</span>
      <b>{ageLabel(data.generatedAt,now)}</b>
      <p>Fort Madison · Central Time</p>
    </section>

    <section className="section watch-section" id="watch">
      <div className="section-head watch-heading"><div><span className="kicker">TODAY’S WATCH BOARD</span><h2>Three reasons to check Fort Madison.</h2></div><p>Bridge openings, the Southwest Chief, and the rare overlap between river and rail traffic. If none is close, the page should tell you not to waste your time.</p></div>
      <div className="watch-board">
        <article className="bridge-watch-panel">
          <div className="watch-panel-top"><span className="pulse"/><b>{bridgeTag}</b><span className="truth-chip">{nextTow?.status||"LIVE CHECK"}</span></div>
          <h3>{bridgeHeadline}</h3>
          <p>{bridgeCopy}</p>
          <div className="bridge-window-row"><div><span>LIKELY OPENING WINDOW</span><strong>{bridgeWindow}</strong></div><div><span>NAMED TOW</span><strong>{nextTow?.vesselName||"None in corridor"}</strong><small>{nextTow?`${nextTow.direction}${nextTow.barges?` · ${nextTow.barges} barges`:""}`:"Locks 18 + 19 are still being checked"}</small></div></div>
          <div className="watch-actions"><a href="#camera" onClick={()=>track("watch_board_click",{target:"camera",mode:bridgeTag})}>Watch live camera ↓</a><a href="#map" onClick={()=>track("watch_board_click",{target:"map",mode:bridgeTag})}>See approach map ↓</a></div>
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
            <span className="signal-icon">R</span>
            <div><span className="label">RAIL ACTIVITY</span><strong>{freight.length?`${freight.length} identified freight movement${freight.length===1?"":"s"}`:"Freight identity feed not connected"}</strong><p>{freight.length?"Only movements reported by the configured source are counted.":"The page will not invent freight IDs just to make the screen look busy."}</p></div>
          </article>
        </div>
      </div>
    </section>

    <section className="section camera-section" id="camera">
      <div className="section-head camera-head"><div><span className="kicker">LIVE FORT MADISON CAMERA</span><h2>Watch when the board gives you a reason.</h2></div><p>The stream is the payoff, not the product. Use the watch board above to decide when it is worth leaving this running.</p></div>
      <div className="camera-stage">
        <div className="video-shell">
          <div className="video-top"><span><i/>LIVE CAMERA</span><small>Fort Madison · YouTube Live</small></div>
          <div className="video-frame"><iframe src={`https://www.youtube.com/embed/${RAILCAM_ID}?rel=0&playsinline=1`} title="Fort Madison live camera" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
          <div className="video-credit">Live stream via the publisher’s official YouTube player. Video availability and rights remain with the stream publisher.</div>
        </div>
        <div className="camera-context"><strong>{bridgeTag}</strong><span>{nextTow?`${nextTow.vesselName} · ${bridgeWindow}`:"No modeled bridge opening close enough yet."}</span><a href={RAILCAM_URL} target="_blank" rel="noreferrer" onClick={()=>track("camera_external_click",{provider:"youtube"})}>Open stream on YouTube ↗</a></div>
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
