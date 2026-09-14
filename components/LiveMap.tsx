"use client";
import { useEffect, useRef, useState } from "react";
import type { DashboardSnapshot } from "../lib/types";

const BRIDGE:[number,number]=[-91.29278,40.62833];
const STATION:[number,number]=[-91.31353,40.62961];
const RIVERFRONT:[number,number]=[-91.3054,40.62855];
const CARTO_KEY="cb1_2y8f_1_1ee5e3a872c91d0ebf5d7b88";
const CARTO_TILE=(subdomain:string)=>`https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_KEY)}`;

type Point=[number,number];
type AisVessel={
  mmsi:string;
  name:string;
  lat:number;
  lon:number;
  sogKnots:number|null;
  cogDeg:number|null;
  headingDeg:number|null;
  direction:"northbound"|"southbound"|"stopped"|"unknown";
  receivedAt:string;
  source:string;
};
type AisSnapshot={generatedAt:string;vessels:AisVessel[];health:{ok:boolean;detail:string;source:string}};

function aisApiUrl(){
  if(typeof window!=="undefined"&&window.location.pathname.startsWith("/national-tools/fort-madison-live"))return "/national-tools/fort-madison-live/api/ais";
  return "/api/ais";
}

function vesselLabel(v:AisVessel){
  const speed=v.sogKnots===null?"speed unavailable":`${v.sogKnots.toFixed(1)} kn`;
  const course=v.cogDeg===null?"course unavailable":`${Math.round(v.cogDeg)}° course`;
  return `${v.name} · MMSI ${v.mmsi} · ${v.direction} · ${speed} · ${course} · live AIS`;
}

export default function LiveMap({data}:{data:DashboardSnapshot}){
  const containerRef=useRef<HTMLDivElement>(null);
  const mapRef=useRef<any>(null);
  const observedRef=useRef<Point[]>([]);
  const aisRef=useRef<Point[]>([]);
  const [aisState,setAisState]=useState<{count:number;ok:boolean;detail:string;source:string}>({count:0,ok:false,detail:"Checking live AIS…",source:"AIS"});

  useEffect(()=>{
    let map:any;
    let cancelled=false;
    let aisTimer:ReturnType<typeof setInterval>|undefined;
    let aisMarkers:any[]=[];

    (async()=>{
      if(!containerRef.current)return;
      const maplibre=await import("maplibre-gl");
      if(cancelled||!containerRef.current)return;

      map=new maplibre.Map({
        container:containerRef.current,
        center:[-91.3015,40.629],
        zoom:12.65,
        minZoom:8,
        maxZoom:18,
        bearing:0,
        pitch:0,
        dragRotate:false,
        renderWorldCopies:false,
        attributionControl:false,
        style:{
          version:8,
          sources:{
            voyager:{type:"raster",tiles:[CARTO_TILE("a"),CARTO_TILE("b"),CARTO_TILE("c"),CARTO_TILE("d")],tileSize:256,attribution:"© OpenStreetMap contributors © CARTO"},
            railCorridor:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[[-91.322,40.6301],[-91.31353,40.62961],[-91.305,40.6292],[-91.298,40.62875],BRIDGE,[-91.283,40.62775],[-91.274,40.6272]]}}},
            riverApproach:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[[-91.2865,40.664],[-91.288,40.651],[-91.2898,40.642],BRIDGE,[-91.2938,40.615],[-91.2952,40.598]]}}},
            bridgeWatch:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"Point",coordinates:BRIDGE}}}
          },
          layers:[
            {id:"voyager",type:"raster",source:"voyager"},
            {id:"river-approach-halo",type:"line",source:"riverApproach",paint:{"line-color":"#ffffff","line-width":7,"line-opacity":0.78}},
            {id:"river-approach",type:"line",source:"riverApproach",paint:{"line-color":"#14758d","line-width":4,"line-opacity":0.88,"line-dasharray":[2,1.3]}},
            {id:"rail-halo",type:"line",source:"railCorridor",paint:{"line-color":"#ffffff","line-width":7,"line-opacity":0.82}},
            {id:"rail-corridor",type:"line",source:"railCorridor",paint:{"line-color":"#2f3e44","line-width":4,"line-opacity":0.95}},
            {id:"bridge-watch-zone",type:"circle",source:"bridgeWatch",paint:{"circle-radius":34,"circle-color":"#c65a35","circle-opacity":0.12,"circle-stroke-color":"#c65a35","circle-stroke-width":2,"circle-stroke-opacity":0.7}}
          ]
        }
      });
      mapRef.current=map;
      map.addControl(new maplibre.NavigationControl({showCompass:false}),"top-right");
      map.addControl(new maplibre.ScaleControl({maxWidth:110,unit:"imperial"}),"bottom-left");
      map.addControl(new maplibre.AttributionControl({compact:true}),"bottom-right");

      let tracked=false;
      const trackMap=()=>{if(tracked)return;tracked=true;(window as any).gtag?.("event","map_interaction",{tool:"fort_madison_live"});};
      map.on("dragstart",trackMap);map.on("zoomstart",trackMap);map.on("click",trackMap);

      const add=(lon:number,lat:number,label:string,cls:string,glyph:string)=>{
        const el=document.createElement("button");
        el.type="button";el.className=`map-marker ${cls}`;el.title=label;el.setAttribute("aria-label",label);
        const span=document.createElement("span");span.textContent=glyph;el.appendChild(span);
        return new maplibre.Marker({element:el,anchor:"center"}).setLngLat([lon,lat]).setPopup(new maplibre.Popup({offset:20,closeButton:false}).setText(label)).addTo(map);
      };

      const clearAisMarkers=()=>{
        for(const marker of aisMarkers){try{marker.remove();}catch{}}
        aisMarkers=[];
        aisRef.current=[];
      };

      const addAis=(v:AisVessel)=>{
        const el=document.createElement("button");
        el.type="button";
        el.className="map-marker tow";
        el.title=vesselLabel(v);
        el.setAttribute("aria-label",vesselLabel(v));
        el.style.background=v.direction==="northbound"?"#14758d":v.direction==="southbound"?"#c65a35":"#627472";
        el.style.width="31px";
        el.style.height="31px";
        const arrow=document.createElement("span");
        arrow.textContent="▲";
        arrow.style.display="inline-block";
        arrow.style.fontSize="12px";
        arrow.style.transform=`rotate(${Number.isFinite(v.cogDeg)?v.cogDeg:0}deg)`;
        arrow.style.transformOrigin="center";
        el.appendChild(arrow);
        return new maplibre.Marker({element:el,anchor:"center"})
          .setLngLat([v.lon,v.lat])
          .setPopup(new maplibre.Popup({offset:20,closeButton:false,maxWidth:"310px"}).setText(vesselLabel(v)))
          .addTo(map);
      };

      const refreshAis=async()=>{
        try{
          const response=await fetch(aisApiUrl());
          if(!response.ok)throw new Error(`HTTP ${response.status}`);
          const snapshot=await response.json() as AisSnapshot;
          if(cancelled)return;
          clearAisMarkers();
          const valid=snapshot.vessels.filter(v=>Number.isFinite(v.lon)&&Number.isFinite(v.lat));
          for(const vessel of valid){
            aisMarkers.push(addAis(vessel));
            aisRef.current.push([vessel.lon,vessel.lat]);
          }
          setAisState({count:valid.length,ok:snapshot.health.ok,detail:snapshot.health.detail,source:snapshot.health.source});
          (window as any).gtag?.("event","ais_snapshot",{vessel_count:valid.length,available:snapshot.health.ok});
        }catch(error){
          if(cancelled)return;
          clearAisMarkers();
          setAisState({count:0,ok:false,detail:`AIS refresh failed: ${error instanceof Error?error.message:"unknown error"}`,source:"AIS"});
        }
      };

      add(BRIDGE[0],BRIDGE[1],"Fort Madison double-deck swing bridge · prediction target","bridge","B");
      add(STATION[0],STATION[1],"Historic Santa Fe Depot · Amtrak Southwest Chief","station","A");
      add(RIVERFRONT[0],RIVERFRONT[1],"Riverview Park riverfront viewing area","viewing","V");

      const observed:Point[]=[];
      for(const t of data.trains){if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)){observed.push([t.lon!,t.lat!]);add(t.lon!,t.lat!,`${t.displayId} · ${t.direction}`,"train","T");}}
      for(const t of data.tows){if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)){observed.push([t.lon!,t.lat!]);add(t.lon!,t.lat!,`${t.vesselName} · ${t.direction}`,"tow","W");}}
      observedRef.current=observed;

      map.once("load",()=>{
        map.resize();
        void refreshAis();
        aisTimer=setInterval(()=>void refreshAis(),45_000);
      });
    })();

    return()=>{
      cancelled=true;
      if(aisTimer)clearInterval(aisTimer);
      for(const marker of aisMarkers){try{marker.remove();}catch{}}
      observedRef.current=[];
      aisRef.current=[];
      if(map)map.remove();
      mapRef.current=null;
    };
  },[data]);

  const focus=(center:Point,zoom=13.5,event="map_focus")=>{mapRef.current?.flyTo({center,zoom,duration:750});(window as any).gtag?.("event",event,{tool:"fort_madison_live"});};
  const fitPoints=(pts:Point[],event:string)=>{
    if(!pts.length)return;
    (window as any).gtag?.("event",event,{tool:"fort_madison_live",count:pts.length});
    if(pts.length===1){mapRef.current?.flyTo({center:pts[0],zoom:12.8,duration:800});return;}
    const lons=pts.map(p=>p[0]),lats=pts.map(p=>p[1]);
    mapRef.current?.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]],{padding:70,maxZoom:13,duration:800});
  };

  const observedCount=data.trains.filter(t=>Number.isFinite(t.lon)&&Number.isFinite(t.lat)).length+data.tows.filter(t=>Number.isFinite(t.lon)&&Number.isFinite(t.lat)).length;
  const nextTow=[...data.tows].filter(t=>t.etaBest).sort((a,b)=>new Date(a.etaBest!).getTime()-new Date(b.etaBest!).getTime())[0];
  const aisSummary=aisState.ok?`${aisState.count} live AIS vessel${aisState.count===1?"":"s"} in corridor · ${aisState.source}`:aisState.detail;

  return <div className="map-experience">
    <div className="corridor-strip" aria-label="Tow prediction corridor">
      <div><span>LOCK 18</span><strong>26.8 mi north</strong></div><i>↓ southbound tow model</i><div className="corridor-target"><span>FORT MADISON</span><strong>SWING BRIDGE</strong></div><i>↑ northbound tow model</i><div><span>LOCK 19</span><strong>19.5 mi south</strong></div>
    </div>
    <div className="map-toolbar">
      <div><strong>Live crossing intelligence map</strong><span>Dark line = rail · dashed teal = tow model · arrow markers = live AIS · {aisSummary}</span></div>
      <div className="map-actions">
        <button type="button" onClick={()=>focus(BRIDGE,14,"map_focus_bridge")}>Bridge</button>
        <button type="button" onClick={()=>focus(RIVERFRONT,13.7,"map_focus_riverfront")}>Riverfront</button>
        <button type="button" onClick={()=>fitPoints(observedRef.current,"map_focus_observed")} disabled={!observedCount}>Observed{observedCount?` · ${observedCount}`:""}</button>
        <button type="button" onClick={()=>fitPoints(aisRef.current,"map_focus_ais")} disabled={!aisState.count}>AIS traffic{aisState.count?` · ${aisState.count}`:""}</button>
      </div>
    </div>
    <div className="map-shell">
      <div ref={containerRef} className="map" aria-label="Interactive Fort Madison rail, river and live AIS vessel map"/>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="line-key rail"/>Rail corridor</span>
        <span><i className="line-key river"/>Tow approach</span>
        <span><i className="dot bridge"/>Swing bridge</span>
        <span><i className="dot tow"/>Live AIS vessel</span>
        <span><i className="dot station"/>Depot</span>
        <span><i className="dot viewing"/>Riverfront</span>
      </div>
      <div className="map-story">
        <span>{aisState.ok?"LIVE RIVER TRAFFIC":"WHY THE LOCK DATA MATTERS"}</span>
        <strong>{aisState.ok&&aisState.count?`${aisState.count} AIS vessel${aisState.count===1?" is":"s are"} reporting in the corridor.`:nextTow?`${nextTow.vesselName} is the next named tow in the model.`:"No named tow is currently inside the modeled corridor."}</strong>
        <p>{aisState.ok?"AIS arrows are actual reported positions and point along each vessel’s current course. Blue is generally northbound, orange southbound, gray stopped/unclear. Lock-derived dashed lines remain a prediction corridor, not GPS.":"A tow leaving Lock 18 southbound or Lock 19 northbound can create a future bridge-opening watch window. Live AIS markers appear here whenever the configured AIS source reports them."}</p>
      </div>
    </div>
  </div>;
}
