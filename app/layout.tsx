import type { Metadata } from "next";
import type { ReactNode } from "react";
import Analytics from "../components/Analytics";
import "./globals.css";
import "./traffic.css";
import "maplibre-gl/dist/maplibre-gl.css";

const site=process.env.NEXT_PUBLIC_SITE_URL || "https://fort-madison-live.vercel.app";
const canonical="https://chrisizworski.com/national-tools/fort-madison-live/";
export const metadata:Metadata={
  metadataBase:new URL(site),
  title:{default:"Fort Madison Bridge Opening Predictor & Live Train Watch",template:"%s | Fort Madison Live"},
  description:"Will the Fort Madison swing bridge open soon? See modeled bridge-opening windows from Mississippi River tow traffic, Southwest Chief timing, live train and barge activity, and the Fort Madison live camera.",
  keywords:["Fort Madison bridge opening","Fort Madison live camera","Fort Madison train cam","Fort Madison railfan","Fort Madison swing bridge","BNSF Fort Madison","Southwest Chief Fort Madison","Fort Madison barge traffic","Iowa train watching"],
  alternates:{canonical},
  openGraph:{title:"Fort Madison Bridge Opening Predictor + Live Train Watch",description:"Know when the Fort Madison swing bridge, trains and Mississippi River traffic are most worth watching.",url:canonical,siteName:"Fort Madison Bridge + Train Watch",type:"website"},
  twitter:{card:"summary_large_image"},
  robots:{index:true,follow:true}
};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}<Analytics/></body></html>}
