const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const TZ = "America/Chicago";

export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
export function midpoint(a, b) { return new Date((new Date(a).getTime() + new Date(b).getTime()) / 2).toISOString(); }

export function normalizeDirection(raw = "") {
  const s = String(raw).trim().toLowerCase();
  if (["up", "u", "upbound", "north", "northbound", "nb"].includes(s)) return "northbound";
  if (["down", "d", "downbound", "south", "southbound", "sb"].includes(s)) return "southbound";
  if (["east", "eastbound", "eb"].includes(s)) return "eastbound";
  if (["west", "westbound", "wb"].includes(s)) return "westbound";
  return "unknown";
}

function zonedLocalToDate({year,month,day,hour,minute,second=0}, timeZone="America/Chicago") {
  const target=Date.UTC(year,month-1,day,hour,minute,second);
  let guess=target;
  const fmt=new Intl.DateTimeFormat("en-US",{timeZone,hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  for(let i=0;i<3;i++){
    const parts={}; for(const p of fmt.formatToParts(new Date(guess))) if(p.type!=="literal") parts[p.type]=Number(p.value);
    const represented=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour===24?0:parts.hour,parts.minute,parts.second);
    const delta=represented-target;
    if(delta===0) break;
    guess-=delta;
  }
  return new Date(guess);
}

export function parseLooseDate(value, timezone="America/Chicago") {
  if (!value) return null;
  const raw=String(value).trim();
  if (/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const direct=new Date(raw); return Number.isNaN(direct.getTime())?null:direct;
  }
  const m=raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) { const direct=new Date(raw); return Number.isNaN(direct.getTime())?null:direct; }
  let [,mo,d,y,h,mi,sec="0"]=m; if(y.length===2)y=`20${y}`;
  const code=String(timezone||"").toUpperCase();
  const zone=code.includes("EAST")||["EST","EDT"].includes(code)?"America/New_York":code.includes("MOUNT")||["MST","MDT"].includes(code)?"America/Denver":code.includes("PAC")||["PST","PDT"].includes(code)?"America/Los_Angeles":"America/Chicago";
  return zonedLocalToDate({year:Number(y),month:Number(mo),day:Number(d),hour:Number(h),minute:Number(mi),second:Number(sec)},zone);
}

export function estimateTowFromLock(row, lockNumber, now = new Date()) {
  const direction = normalizeDirection(row.direction);
  const eligible = (lockNumber === "18" && direction === "southbound") || (lockNumber === "19" && direction === "northbound");
  if (!eligible) return null;
  const passage = parseLooseDate(row.end_of_lockage || row.endOfLockage || row.arrival_date || row.arrivalDate, row.timezone || "America/Chicago");
  if (!passage) return null;
  const ageHours = (now.getTime() - passage.getTime()) / HOUR;
  if (ageHours < -1 || ageHours > 10) return null;
  const distanceMi = lockNumber === "18" ? 26.8 : 19.5;
  const fastMph = 8.0;
  const slowMph = 4.0;
  const etaStart = new Date(passage.getTime() + (distanceMi / fastMph) * HOUR);
  const etaEnd = new Date(passage.getTime() + (distanceMi / slowMph) * HOUR);
  if (etaEnd.getTime() < now.getTime() - 30 * MINUTE) return null;
  const etaBest = new Date((etaStart.getTime() + etaEnd.getTime()) / 2);
  const barges = Number.parseInt(row.num_barges ?? row.numBarges ?? "", 10);
  return {
    id: `lpms-${lockNumber}-${row.vessel_no || row.vesselNumber || row.vessel_name || row.vesselName}-${passage.getTime()}`,
    vesselName: row.vessel_name || row.vesselName || "Commercial tow",
    vesselNumber: row.vessel_no || row.vesselNumber || undefined,
    direction,
    barges: Number.isFinite(barges) ? barges : null,
    sourceLock: lockNumber,
    lastObservedAt: passage.toISOString(),
    etaStart: etaStart.toISOString(),
    etaBest: etaBest.toISOString(),
    etaEnd: etaEnd.toISOString(),
    bridgeOpenStart: new Date(etaStart.getTime() - 8 * MINUTE).toISOString(),
    bridgeOpenEnd: new Date(etaEnd.getTime() + 20 * MINUTE).toISOString(),
    confidence: row.end_of_lockage || row.endOfLockage ? "MODERATE" : "LOW",
    status: "ESTIMATED",
    note: `Named tow observed in USACE LPMS at Lock ${lockNumber}; Fort Madison timing is a conservative corridor model, not an official bridge schedule.`
  };
}

export function intervalOverlapProbability(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return null;
  const a1 = new Date(aStart).getTime(), a2 = new Date(aEnd).getTime();
  const b1 = new Date(bStart).getTime(), b2 = new Date(bEnd).getTime();
  if (![a1,a2,b1,b2].every(Number.isFinite)) return null;
  const overlap = Math.max(0, Math.min(a2,b2) - Math.max(a1,b1));
  if (overlap <= 0) return 0;
  const narrow = Math.max(1, Math.min(a2-a1, b2-b1));
  const ratio = overlap / narrow;
  return Math.round(clamp(35 + ratio * 60, 35, 95));
}

function localDayKey(value) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
}

function scoreTowOpening(tow, now = new Date()) {
  if (!tow) return { percent:null, label:"NO CURRENT SIGNAL", reasons:["No named tow is currently inside the modeled Fort Madison corridor."] };
  const confidenceBase={"VERY HIGH":72,"HIGH":66,"MODERATE":56,"LOW":42,"UNAVAILABLE":30}[tow.confidence] ?? 40;
  let score=confidenceBase;
  const reasons=[];
  if (["18","19"].includes(String(tow.sourceLock))) { score+=8; reasons.push(`named tow observed at Lock ${tow.sourceLock}`); }
  if (tow.lastObservedAt) {
    const ageHours=Math.max(0,(now.getTime()-new Date(tow.lastObservedAt).getTime())/HOUR);
    if (ageHours<=2) { score+=12; reasons.push("recent lock observation"); }
    else if (ageHours<=4) { score+=8; reasons.push("fairly recent lock observation"); }
    else if (ageHours<=7) { score+=3; reasons.push("usable lock observation"); }
  }
  const start=tow.bridgeOpenStart||tow.etaStart||tow.etaBest;
  if (start) {
    const mins=(new Date(start).getTime()-now.getTime())/MINUTE;
    if (mins<=30&&mins>=-20) { score+=12; reasons.push("opening window is near"); }
    else if (mins<=90&&mins>=0) { score+=8; reasons.push("opening window is approaching"); }
    else if (mins<=180&&mins>=0) { score+=4; reasons.push("tow is inside the watch horizon"); }
  }
  if (Number.isFinite(tow.barges)) { score+=3; reasons.push("barge count reported"); }
  score=Math.round(clamp(score,25,92));
  const label=score>=80?"HIGH":score>=65?"ELEVATED":score>=50?"MODERATE":"LOW";
  return { percent:score, label, reasons:reasons.slice(0,3) };
}

export function computeBridgeOpeningWatch(tows = [], now = new Date()) {
  const candidates=tows
    .filter(t=>t.etaBest && new Date(t.bridgeOpenEnd||t.etaEnd||t.etaBest).getTime()>=now.getTime()-15*MINUTE)
    .sort((a,b)=>new Date(a.bridgeOpenStart||a.etaBest).getTime()-new Date(b.bridgeOpenStart||b.etaBest).getTime());
  const tow=candidates[0];
  const score=scoreTowOpening(tow,now);
  if(!tow) return { ...score, vesselName:null, start:null, best:null, end:null, sourceLock:null, confidence:"UNAVAILABLE", status:"UNAVAILABLE" };
  return {
    ...score,
    vesselName:tow.vesselName,
    start:tow.bridgeOpenStart||tow.etaStart||tow.etaBest,
    best:tow.etaBest,
    end:tow.bridgeOpenEnd||tow.etaEnd||tow.etaBest,
    sourceLock:tow.sourceLock,
    confidence:tow.confidence,
    status:tow.status
  };
}

function checkBackTime(start, now) {
  if(!start) return new Date(now.getTime()+30*MINUTE).toISOString();
  const startMs=new Date(start).getTime();
  const delta=(startMs-now.getTime())/MINUTE;
  if(delta>120) return new Date(startMs-45*MINUTE).toISOString();
  if(delta>60) return new Date(startMs-30*MINUTE).toISOString();
  if(delta>25) return new Date(startMs-15*MINUTE).toISOString();
  return now.toISOString();
}

export function computeBestWatchWindow(trains = [], tows = [], now = new Date()) {
  const today=localDayKey(now);
  const candidates=[];
  for(const tow of tows){
    if(!tow.etaBest || localDayKey(tow.etaBest)!==today) continue;
    const end=tow.bridgeOpenEnd||tow.etaEnd||tow.etaBest;
    if(new Date(end).getTime()<now.getTime()-15*MINUTE) continue;
    const likelihood=scoreTowOpening(tow,now);
    candidates.push({
      kind:"bridge",
      title:`${tow.vesselName} bridge watch`,
      start:tow.bridgeOpenStart||tow.etaStart||tow.etaBest,
      best:tow.etaBest,
      end,
      score:Math.round(64+(likelihood.percent||0)*0.25),
      label:"SWING BRIDGE",
      reason:`A named ${tow.direction} tow creates a modeled swing-bridge opening window${tow.barges?` with ${tow.barges} barges`:""}.`,
      confidence:tow.confidence
    });
  }
  for(const train of trains){
    if(!train.etaBest || localDayKey(train.etaBest)!==today || new Date(train.etaBest).getTime()<now.getTime()-15*MINUTE) continue;
    const isAmtrak=String(train.carrier||"").toLowerCase()==="amtrak";
    candidates.push({
      kind:"train",
      title:train.displayId,
      start:train.etaStart||train.etaBest,
      best:train.etaBest,
      end:train.etaEnd||train.etaBest,
      score:isAmtrak?60:48,
      label:isAmtrak?"SOUTHWEST CHIEF":"TRAIN WATCH",
      reason:isAmtrak?"A scheduled passenger move gives visitors a specific train to watch for.":"An identified freight movement is inside the Fort Madison watch horizon.",
      confidence:train.confidence
    });
  }
  for(const train of trains){
    for(const tow of tows){
      const p=intervalOverlapProbability(train.etaStart,train.etaEnd,tow.bridgeOpenStart,tow.bridgeOpenEnd);
      if(!p || p<35) continue;
      const startMs=Math.max(new Date(train.etaStart||train.etaBest).getTime(),new Date(tow.bridgeOpenStart||tow.etaStart||tow.etaBest).getTime());
      const endMs=Math.min(new Date(train.etaEnd||train.etaBest).getTime(),new Date(tow.bridgeOpenEnd||tow.etaEnd||tow.etaBest).getTime());
      if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||endMs<now.getTime()-15*MINUTE||localDayKey(startMs)!==today) continue;
      candidates.push({
        kind:"convergence",
        title:`${tow.vesselName} + ${train.displayId}`,
        start:new Date(startMs).toISOString(),
        best:new Date((startMs+endMs)/2).toISOString(),
        end:new Date(endMs).toISOString(),
        score:Math.round(clamp(82+p*0.18,88,99)),
        label:"RIVER + RAIL",
        reason:`A tow-driven bridge window overlaps ${train.displayId}; this is the highest-interest event the engine can identify.`,
        confidence:p>=75?"HIGH":"MODERATE"
      });
    }
  }
  candidates.sort((a,b)=>b.score-a.score || new Date(a.best).getTime()-new Date(b.best).getTime());
  const best=candidates[0];
  if(!best) return {kind:"quiet",title:"No strong watch window yet",start:null,best:null,end:null,score:0,label:"CHECK BACK",reason:"No identifiable bridge, passenger-train or convergence event is currently strong enough to recommend.",confidence:"UNAVAILABLE",checkBackAt:new Date(now.getTime()+30*MINUTE).toISOString()};
  return {...best,checkBackAt:checkBackTime(best.start,now)};
}

export function chooseNextEvent(trains = [], tows = [], now = new Date()) {
  const candidates = [];
  for (const t of trains) if (t.etaBest) candidates.push({kind:"train", time:new Date(t.etaBest).getTime(), item:t});
  for (const t of tows) if (t.etaBest) candidates.push({kind:"tow", time:new Date(t.etaBest).getTime(), item:t});
  candidates.sort((a,b)=>a.time-b.time);
  const next = candidates.find(c => c.time >= now.getTime() - 10*MINUTE);
  if (!next) return {kind:"quiet", title:"No confirmed event imminent", subtitle:"Watching the rail and river corridors for the next identified movement.", confidence:"UNAVAILABLE", status:"UNAVAILABLE", watchLabel:"CHECK BACK"};
  if (next.kind === "train") {
    const t = next.item;
    return {kind:"train", title:t.displayId, subtitle:`${capitalize(t.direction)} · ${t.type}`, etaBest:t.etaBest, etaStart:t.etaStart, etaEnd:t.etaEnd, confidence:t.confidence, status:t.status, watchLabel:"NEXT TRAIN"};
  }
  const t = next.item;
  return {kind:"tow", title:t.vesselName, subtitle:`${capitalize(t.direction)}${t.barges ? ` · ${t.barges} barges` : ""}`, etaBest:t.etaBest, etaStart:t.etaStart, etaEnd:t.etaEnd, confidence:t.confidence, status:t.status, watchLabel:"NEXT TOW / BRIDGE EVENT"};
}

export function computeConvergence(trains = [], tows = []) {
  let best = null;
  for (const train of trains) {
    for (const tow of tows) {
      const p = intervalOverlapProbability(train.etaStart, train.etaEnd, tow.bridgeOpenStart, tow.bridgeOpenEnd);
      if (p !== null && (!best || p > best.p)) best = {p, train, tow};
    }
  }
  if (!best || best.p === 0) return {state:(trains.length+tows.length)>=3?"ACTIVE":"QUIET", message:"No modeled rail/bridge overlap is currently strong enough to call out.", overlapProbability:best?.p ?? null};
  if (best.p >= 75) return {state:"CONVERGENCE EVENT", message:`${best.train.displayId} and ${best.tow.vesselName} have strongly overlapping approach windows.`, overlapProbability:best.p};
  if (best.p >= 55) return {state:"VERY ACTIVE", message:`A train and tow may reach the bridge in the same operating window.`, overlapProbability:best.p};
  return {state:"ACTIVE", message:"Rail and river traffic are both active, with limited predicted overlap.", overlapProbability:best.p};
}

function capitalize(s) { return s ? s[0].toUpperCase()+s.slice(1) : s; }
