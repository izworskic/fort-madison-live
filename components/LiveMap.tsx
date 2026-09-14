"use client";
import { useEffect, useRef } from "react";
import type { DashboardSnapshot } from "../lib/types";

const BRIDGE:[number,number]=[-91.29278,40.62833];
const STATION:[number,number]=[-91.30903,40.62958];
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
        center:BRIDGE,
        zoom:12.7,
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
            voyager:{
              type:"raster",
              tiles:[CARTO_TILE("a"),CARTO_TILE("b"),CARTO_TILE("c"),CARTO_TILE("d")],
              tileSize:256,
              attribution:"© OpenStreetMap contributors © CARTO"
            }
          },
          layers:[{id:"voyager",type:"raster",source:"voyager"}]
        }
      });
      mapRef.current=map;
      map.addControl(new maplibre.NavigationControl({showCompass:false}),"top-right");
      map.addControl(new maplibre.ScaleControl({maxWidth:110,unit:"imperial"}),"bottom-left");
      map.addControl(new maplibre.AttributionControl({compact:true}),"bottom-right");
      map.once("load",()=>map.resize());

      let tracked=false;
      const trackMap=()=>{
        if(tracked)return;
        tracked=true;
        (window as any).gtag?.("event","map_interaction",{tool:"fort_madison_live"});
      };
      map.on("dragstart",trackMap);
      map.on("zoomstart",trackMap);
      map.on("click",trackMap);

      const add=(lon:number,lat:number,label:string,cls:string,glyph:string)=>{
        const el=document.createElement("button");
        el.type="button";
        el.className=`map-marker ${cls}`;
        el.title=label;
        el.setAttribute("aria-label",label);
        const span=document.createElement("span");
        span.textContent=glyph;
        el.appendChild(span);
        new maplibre.Marker({element:el,anchor:"center"})
          .setLngLat([lon,lat])
          .setPopup(new maplibre.Popup({offset:20,closeButton:false,maxWidth:"280px"}).setText(label))
          .addTo(map);
      };

      add(BRIDGE[0],BRIDGE[1],"Fort Madison double-deck swing bridge","bridge","B");
      add(STATION[0],STATION[1],"Fort Madison Amtrak depot","station","A");

      const observed:Point[]=[];
      for(const t of data.trains){
        if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)){
          observed.push([t.lon!,t.lat!]);
          add(t.lon!,t.lat!,`${t.displayId} · ${t.direction}`,"train","T");
        }
      }
      for(const t of data.tows){
        if(Number.isFinite(t.lon)&&Number.isFinite(t.lat)){
          observed.push([t.lon!,t.lat!]);
          add(t.lon!,t.lat!,`${t.vesselName} · ${t.direction}`,"tow","V");
        }
      }
      observedRef.current=observed;
    })();

    return()=>{
      cancelled=true;
      observedRef.current=[];
      if(map)map.remove();
      mapRef.current=null;
    };
  },[data]);

  const focusBridge=()=>{
    mapRef.current?.flyTo({center:BRIDGE,zoom:14,duration:800});
    (window as any).gtag?.("event","map_focus_bridge",{tool:"fort_madison_live"});
  };

  const focusObserved=()=>{
    const pts=observedRef.current;
    if(!pts.length)return;
    if(pts.length===1){
      mapRef.current?.flyTo({center:pts[0],zoom:13.5,duration:800});
      return;
    }
    const lons=pts.map(p=>p[0]);
    const lats=pts.map(p=>p[1]);
    mapRef.current?.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]],{padding:80,maxZoom:14,duration:800});
  };

  const showCrossing=()=>{
    mapRef.current?.fitBounds([[-91.34,40.605],[-91.245,40.65]],{padding:55,maxZoom:13.8,duration:800});
  };

  const observedCount=data.trains.filter(t=>Number.isFinite(t.lon)&&Number.isFinite(t.lat)).length+data.tows.filter(t=>Number.isFinite(t.lon)&&Number.isFinite(t.lat)).length;

  return <div className="map-experience">
    <div className="map-toolbar">
      <div><strong>Fort Madison crossing</strong><span>Mississippi River, swing bridge, depot and observed movements</span></div>
      <div className="map-actions">
        <button type="button" onClick={showCrossing}>Show crossing</button>
        <button type="button" onClick={focusBridge}>Bridge close-up</button>
        <button type="button" onClick={focusObserved} disabled={!observedCount}>Observed now{observedCount?` · ${observedCount}`:""}</button>
      </div>
    </div>
    <div className="map-shell">
      <div ref={containerRef} className="map" aria-label="Interactive Fort Madison river and rail map"/>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="dot bridge"/>Swing bridge</span>
        <span><i className="dot station"/>Amtrak depot</span>
        <span><i className="dot train"/>Observed train</span>
        <span><i className="dot tow"/>Observed tow</span>
      </div>
      <div className="map-story">
        <span>READ THE CROSSING</span>
        <strong>The bridge is the decision point.</strong>
        <p>Rail traffic crosses the Mississippi here while commercial tows need the navigation channel. Use the live markers with the engine above to see when those movements may converge.</p>
      </div>
    </div>
  </div>;
}
