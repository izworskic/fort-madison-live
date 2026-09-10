import type { TrainEvent } from "../types";

const FMD = { lat:40.62958, lon:-91.30903 };
const TZ = "America/Chicago";

function centralParts(d=new Date()){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
  const o:any={}; for(const p of parts)o[p.type]=p.value; return o;
}
function centralIsoAt(hour:number,minute:number,dayOffset=0){
  const p=centralParts(new Date(Date.now()+dayOffset*86400000));
  const target=`${p.year}-${p.month}-${p.day}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00`;
  let guess=new Date(`${target}-05:00`);
  const shown=new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(guess);
  if(!shown.includes(`${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`)) guess=new Date(`${target}-06:00`);
  return guess.toISOString();
}

async function liveOverride():Promise<TrainEvent[]|null>{
  const url=process.env.AMTRAK_LIVE_FEED_URL; if(!url) return null;
  try{
    const res=await fetch(url,{headers:process.env.AMTRAK_LIVE_FEED_TOKEN?{Authorization:`Bearer ${process.env.AMTRAK_LIVE_FEED_TOKEN}`}:{},cache:"no-store"});
    if(!res.ok) return null; const j:any=await res.json(); const rows=Array.isArray(j)?j:Array.isArray(j?.trains)?j.trains:[];
    return rows.filter((x:any)=>["3","4",3,4].includes(x.trainNumber??x.number)).map((x:any)=>({
      id:`amtrak-${x.trainNumber??x.number}`,carrier:"Amtrak",displayId:`Southwest Chief #${x.trainNumber??x.number}`,trainNumber:String(x.trainNumber??x.number),
      direction:String(x.trainNumber??x.number)==="4"?"eastbound":"westbound",type:"Passenger — Southwest Chief",etaBest:x.eta??x.estimatedArrival,etaStart:x.etaStart??x.eta??x.estimatedArrival,etaEnd:x.etaEnd??x.eta??x.estimatedArrival,
      lastObservedAt:x.observedAt??x.updatedAt,lastObservedLabel:x.location??"Amtrak live feed",lat:Number(x.lat)||undefined,lon:Number(x.lon)||undefined,
      confidence:"VERY HIGH",status:"OBSERVED",note:"Live status from configured Amtrak provider."
    }));
  }catch{return null;}
}

export async function getAmtrakEvents():Promise<{events:TrainEvent[],health:{ok:boolean,detail:string}}> {
  const live=await liveOverride(); if(live?.length) return {events:live,health:{ok:true,detail:"Live Amtrak provider active."}};
  const now=Date.now(); const specs=[
    {n:"4",hour:10,min:22,dir:"eastbound" as const,label:"Chicago-bound"},
    {n:"3",hour:18,min:5,dir:"westbound" as const,label:"Los Angeles-bound"}
  ];
  const events:TrainEvent[]=[];
  for(const s of specs){
    let eta=centralIsoAt(s.hour,s.min,0); if(new Date(eta).getTime()<now-30*60000) eta=centralIsoAt(s.hour,s.min,1);
    events.push({id:`amtrak-${s.n}-${eta.slice(0,10)}`,carrier:"Amtrak",displayId:`Southwest Chief #${s.n}`,trainNumber:s.n,direction:s.dir,type:`Passenger · ${s.label}`,etaBest:eta,etaStart:eta,etaEnd:eta,confidence:"HIGH",status:"SCHEDULED",note:"Official published timetable fallback; this is not live running status."});
  }
  return {events,health:{ok:true,detail:"Official schedule fallback active; configure AMTRAK_LIVE_FEED_URL for live delay/location data."}};
}
