"use client";
import { useEffect, useRef } from "react";
import type { DashboardSnapshot } from "../lib/types";

const BRIDGE:[number,number]=[-91.29278,40.62833];
const STATION:[number,number]=[-91.31353,40.62961];
const RIVERFRONT:[number,number]=[-91.3054,40.62855];
const CARTO_KEY="cb1_2y8f_1_1ee5e3a872c91d0ebf5d7b88";
const CARTO_TILE=(subdomain:string)=>`https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_KEY)}`;

type Point=[number,number];

export default function LiveMap({data}:{data:DashboardSnapshot}){
  const containerRef=useRef<HTMLDivElement>(null);
  const mapRef=useRef<any>(null);
  const observedRef=useRef<Point[]>([]);

  useEffect(()=>{
    let map:any;
    let cancelled=false;
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
      map.once("load",()=>map.resize());

      let tracked=false;
      const trackMap=()=>{if(tracked)return;tracked=true;(window as any).gtag?.("event","map_interaction",{tool:"fort_madison_live"});};
      map.on("dragstart",trackMap);map.on("zoomstart",trackMap);map.on("click",trackMap);

      const add=(lon:number,lat:number,label:string,cls:string,glyph:string)=>{
        const el=document.createElement("button");
        el.type="button";el.className=`map-marker ${cls}`;el.title=label;el.setAttribute("aria-label",label);
        const span=document.createElement("span");span.textContent=glyph;el.appendChild(span);
        new maplibre.Marker({element:el,anchor:"center"}).setLngLat([lon,lat]).setPopup(new maplibre.Popup({offset:20,closeButton:false}).setText(label)).addTo(map);
      };

      add(BRIDGE[0],BRIDGE[1],"Fort Madison double-deck swing bridge · prediction target","bridge","B");
      add(STATION[0],STATION[1],"Historic Santa Fe Depot · Amtrak Southwest Chief","station","A");
      add(RIVERFRONT[0],RIVERFRONT[1],"Riverview Park riverfront viewing area","viewing","V");

      const observed:Point[]=[];
      for(const t of data.trains){if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)){observed.push([t.lon!,t.lat!]);add(t.lon!,t.lat!,`${t.displayId} · ${t.direction}`,"train","T");}}
      for(const t of data.tows){if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)){observed.push([t.lon!,t.lat!]);add(t.lon!,t.lat!,`${t.vesselName} · ${t.direction}`,"tow","W");}}
      observedRef.current=observed;
    })();

    return()=>{cancelled=true;observedRef.current=[];if(map)map.remove();mapRef.current=null;};
  },[data]);

  const focus=(center:Point,zoom=13.5,event="map_focus")=>{mapRef.current?.flyTo({center,zoom,duration:750});(window as any).gtag?.("event",event,{tool:"fort_madison_live"});};
  const focusObserved=()=>{
    const pts=observedRef.current;if(!pts.length)return;
    if(pts.length===1){mapRef.current?.flyTo({center:pts[0],zoom:12.8,duration:800});return;}
    const lons=pts.map(p=>p[0]),lats=pts.map(p=>p[1]);
    mapRef.current?.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]],{padding:70,maxZoom:13,duration:800});
  };

  const observedCount=data.trains.filter(t=>Number.isFinite(t.lon)&&Number.isFinite(t.lat)).length+data.tows.filter(t=>Number.isFinite(t.lon)&&Number.isFinite(t.lat)).length;
  const nextTow=[...data.tows].filter(t=>t.etaBest).sort((a,b)=>new Date(a.etaBest!).getTime()-new Date(b.etaBest!).getTime())[0];

  return <div className="map-experience">
    <div className="corridor-strip" aria-label="Tow prediction corridor">
      <div><span>LOCK 18</span><strong>26.8 mi north</strong></div><i>↓ southbound tow model</i><div className="corridor-target"><span>FORT MADISON</span><strong>SWING BRIDGE</strong></div><i>↑ northbound tow model</i><div><span>LOCK 19</span><strong>19.5 mi south</strong></div>
    </div>
    <div className="map-toolbar">
      <div><strong>Live crossing intelligence map</strong><span>Solid dark = rail corridor · dashed teal = river approach model · orange = swing bridge target</span></div>
      <div className="map-actions">
        <button type="button" onClick={()=>focus(BRIDGE,14,"map_focus_bridge")}>Bridge</button>
        <button type="button" onClick={()=>focus(RIVERFRONT,13.7,"map_focus_riverfront")}>Riverfront</button>
        <button type="button" onClick={focusObserved} disabled={!observedCount}>Observed{observedCount?` · ${observedCount}`:""}</button>
      </div>
    </div>
    <div className="map-shell">
      <div ref={containerRef} className="map" aria-label="Interactive Fort Madison rail and river approach map"/>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="line-key rail"/>Rail corridor</span>
        <span><i className="line-key river"/>Tow approach</span>
        <span><i className="dot bridge"/>Swing bridge</span>
        <span><i className="dot station"/>Depot</span>
        <span><i className="dot viewing"/>Riverfront</span>
      </div>
      <div className="map-story">
        <span>WHY THE LOCK DATA MATTERS</span>
        <strong>{nextTow?`${nextTow.vesselName} is the next named tow in the model.`:"No named tow is currently inside the modeled corridor."}</strong>
        <p>A tow leaving Lock 18 southbound or Lock 19 northbound can create a future bridge-opening watch window. The dashed river line shows the relationship; it is a corridor model, not vessel GPS.</p>
      </div>
    </div>
  </div>;
}
