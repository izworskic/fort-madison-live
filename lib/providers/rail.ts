import type { TrainEvent } from "../types";
import { normalizeFreightRow } from "../rail.js";

export async function getFreightEvents():Promise<{events:TrainEvent[],health:{ok:boolean,detail:string}}> {
  const url=process.env.RAIL_FEED_URL;
  if(!url) return {events:[],health:{ok:false,detail:"Freight identity provider not configured. No freight train is fabricated."}};
  try{
    const headers:Record<string,string>={Accept:"application/json"}; if(process.env.RAIL_FEED_TOKEN)headers.Authorization=`Bearer ${process.env.RAIL_FEED_TOKEN}`;
    const res=await fetch(url,{headers,cache:"no-store"}); if(!res.ok)throw new Error(`Rail feed ${res.status}`); const j:any=await res.json();
    const rows=Array.isArray(j)?j:Array.isArray(j?.trains)?j.trains:Array.isArray(j?.sightings)?j.sightings:[];
    const events:TrainEvent[]=rows.map((x:any,i:number)=>normalizeFreightRow(x,i) as TrainEvent).filter((x:TrainEvent)=>x.etaBest||x.lastObservedAt).slice(0,12);
    return {events,health:{ok:true,detail:`Freight provider active; ${events.length} movement(s) normalized.`}};
  }catch(err:any){return {events:[],health:{ok:false,detail:`Freight provider unavailable: ${String(err?.message??err)}`}};}
}
