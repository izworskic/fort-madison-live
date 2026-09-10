"use client";
import { useEffect, useRef } from "react";
import type { DashboardSnapshot } from "../lib/types";

export default function LiveMap({data}:{data:DashboardSnapshot}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let map:any; let cancelled=false;
    (async()=>{
      if(!ref.current)return;
      const maplibre=await import("maplibre-gl");
      if(cancelled||!ref.current)return;
      map=new maplibre.Map({container:ref.current,center:[-91.2928,40.6283],zoom:10.1,attributionControl:false,style:{version:8,sources:{osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"}},layers:[{id:"osm",type:"raster",source:"osm"}]}});
      map.addControl(new maplibre.NavigationControl({showCompass:false}),"top-right");
      let tracked=false; const trackMap=()=>{if(tracked)return;tracked=true;(window as any).gtag?.("event","map_interaction",{tool:"fort_madison_live"});};
      map.on("dragstart",trackMap); map.on("zoomstart",trackMap); map.on("click",trackMap);
      map.addControl(new maplibre.AttributionControl({compact:true}),"bottom-right");
      const add=(lon:number,lat:number,label:string,cls:string)=>{const el=document.createElement("div");el.className=`map-marker ${cls}`;el.title=label;el.setAttribute("aria-label",label); new maplibre.Marker({element:el}).setLngLat([lon,lat]).setPopup(new maplibre.Popup({offset:16}).setText(label)).addTo(map);};
      add(-91.29278,40.62833,"Fort Madison swing bridge","bridge");
      add(-91.30903,40.62958,"Fort Madison Amtrak station","station");
      for(const t of data.trains) if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)) add(t.lon!,t.lat!,t.displayId,"train");
      for(const t of data.tows) if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)) add(t.lon!,t.lat!,t.vesselName,"tow");
    })();
    return()=>{cancelled=true; if(map)map.remove();};
  },[data]);
  return <div className="map-shell"><div ref={ref} className="map" aria-label="Interactive Fort Madison river and rail map"/><div className="map-legend"><span><i className="dot bridge"/>Bridge</span><span><i className="dot train"/>Observed train</span><span><i className="dot tow"/>Observed tow</span></div></div>;
}
