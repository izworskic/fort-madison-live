import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "../../../lib/dashboard";
export const dynamic = "force-dynamic";
export async function GET(){ const data=await getDashboardSnapshot(); return NextResponse.json(data,{headers:{"Cache-Control":"public, s-maxage=30, stale-while-revalidate=90"}}); }
