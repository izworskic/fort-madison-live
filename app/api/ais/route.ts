import { NextResponse } from "next/server";
import { getAisSnapshot } from "../../../lib/providers/ais";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(){
  const data = await getAisSnapshot();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=90, stale-while-revalidate=300"
    }
  });
}
