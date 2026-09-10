export function normalizeRailDirection(raw){
  const s=String(raw??"").trim().toLowerCase();
  if(s==="e"||s==="east"||s==="eastbound"||s==="eb") return "eastbound";
  if(s==="w"||s==="west"||s==="westbound"||s==="wb") return "westbound";
  return "unknown";
}
export function normalizeFreightRow(x={},i=0){
  const carrier=String(x.carrier??x.operator??x.railroad??"Freight");
  const loco=x.leadLocomotive??x.locomotiveNumber??x.locomotive?.number;
  const direction=normalizeRailDirection(x.direction);
  const dirLabel=direction==="eastbound"?"EAST":direction==="westbound"?"WEST":"";
  const displayId=loco?`${carrier} ${loco}${dirLabel?` ${dirLabel}`:""}`:`${carrier} freight`;
  const lat=Number(x.lat), lon=Number(x.lon);
  return {
    id:String(x.tripId??x.trainTripId??x.id??`rail-${i}`), carrier, displayId, direction,
    type:String(x.trainType??x.type??"Freight"), etaStart:x.etaStart, etaBest:x.etaBest??x.eta, etaEnd:x.etaEnd,
    lastObservedAt:x.detectedAt??x.observedAt, lastObservedLabel:x.sensorName??x.location,
    lat:Number.isFinite(lat)?lat:undefined, lon:Number.isFinite(lon)?lon:undefined,
    confidence:loco?"HIGH":"MODERATE", status:"OBSERVED",
    note:"Freight identity supplied by configured licensed/partner feed."
  };
}
