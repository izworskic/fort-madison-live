import type { TowEvent } from "../types";
import { estimateTowFromLock } from "../engine.js";
import { parseLpmsXml } from "../lpms.js";

async function fetchLock(lock:"18"|"19") {
  const env = lock === "18" ? process.env.LPMS_LOCK18_URL : process.env.LPMS_LOCK19_URL;
  const url = env || `https://corpslocks.usace.army.mil/lpwb/xml.lockqueue?in_river=MI&in_lock=${lock}`;
  const res=await fetch(url,{headers:{"User-Agent":"FortMadisonLive/0.1"},next:{revalidate:900}});
  if(!res.ok) throw new Error(`LPMS Lock ${lock}: ${res.status}`);
  return parseLpmsXml(await res.text());
}

export async function getTowEvents():Promise<{events:TowEvent[],health:{ok:boolean,detail:string}}> {
  const now=new Date(); const events:TowEvent[]=[]; const errors:string[]=[];
  const results=await Promise.allSettled([fetchLock("18"),fetchLock("19")]);
  for (let i=0;i<results.length;i++){
    const lock=(i===0?"18":"19") as "18"|"19"; const r=results[i];
    if(r.status==="rejected"){ errors.push(String(r.reason)); continue; }
    for(const row of r.value){ const e=estimateTowFromLock(row,lock,now); if(e) events.push(e as TowEvent); }
  }
  events.sort((a,b)=>new Date(a.etaBest||0).getTime()-new Date(b.etaBest||0).getTime());
  const seen=new Set<string>(); const deduped=events.filter(e=>{const k=`${e.vesselNumber||e.vesselName}-${e.direction}`; if(seen.has(k))return false; seen.add(k); return true;}).slice(0,8);
  return {events:deduped,health:{ok:errors.length<2,detail:errors.length?`Partial LPMS availability: ${errors.join("; ")}`:`Locks 18/19 queried; ${deduped.length} Fort Madison candidate tow(s).`}};
}
