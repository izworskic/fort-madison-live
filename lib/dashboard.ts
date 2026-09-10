import type { DashboardSnapshot } from "./types";
import { getRiverObservation } from "./providers/noaa";
import { getTowEvents } from "./providers/lpms";
import { getAmtrakEvents } from "./providers/amtrak";
import { getFreightEvents } from "./providers/rail";
import { getNavigationNotices } from "./providers/notices";
import { chooseNextEvent, computeConvergence } from "./engine.js";

export async function getDashboardSnapshot():Promise<DashboardSnapshot>{
  const [river,towResult,amtrakResult,freightResult,noticeResult]=await Promise.all([getRiverObservation(),getTowEvents(),getAmtrakEvents(),getFreightEvents(),getNavigationNotices()]);
  const trains=[...freightResult.events,...amtrakResult.events].sort((a,b)=>new Date(a.etaBest||a.lastObservedAt||0).getTime()-new Date(b.etaBest||b.lastObservedAt||0).getTime());
  return {generatedAt:new Date().toISOString(),river,trains,tows:towResult.events,notices:noticeResult.items,nextEvent:chooseNextEvent(trains,towResult.events,new Date()),convergence:computeConvergence(trains,towResult.events),health:{river:{ok:river.provenance.status!=="UNAVAILABLE",detail:river.provenance.note||river.provenance.source,observedAt:river.observedAt||undefined},lpms:towResult.health,amtrak:amtrakResult.health,freight:freightResult.health,notices:noticeResult.health}};
}
