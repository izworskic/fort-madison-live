import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "../../../lib/dashboard";
export const dynamic="force-dynamic";
export async function GET(){const d=await getDashboardSnapshot(); const ok=Object.values(d.health).some(x=>x.ok); return NextResponse.json({ok,generatedAt:d.generatedAt,providers:d.health},{status:ok?200:503});}
