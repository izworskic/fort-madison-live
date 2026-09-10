import type { Metadata } from "next";
import type { ReactNode } from "react";
import Analytics from "../components/Analytics";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const site=process.env.NEXT_PUBLIC_SITE_URL || "https://fort-madison-live.vercel.app";
export const metadata:Metadata={metadataBase:new URL(site),title:{default:"Fort Madison Live — Trains, Barges & Swing Bridge Openings",template:"%s | Fort Madison Live"},description:"See what is approaching Fort Madison's Mississippi River swing bridge: identified trains, named commercial tows, predicted bridge-opening windows, Southwest Chief times and live river conditions.",alternates:{canonical:"/"},openGraph:{title:"Fort Madison Live — What’s Coming to the Swing Bridge?",description:"Trains + barges + a movable Mississippi River bridge, reconciled into one live event view.",url:"/",siteName:"Fort Madison Live",type:"website"},twitter:{card:"summary_large_image"},robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}<Analytics/></body></html>}
