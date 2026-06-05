import { NextResponse } from "next/server";
import { getRecentLocations, getTreeAnalysisHistory } from "@/lib/db";

export async function GET() {
  const [locations, treeAnalyses] = await Promise.all([
    getRecentLocations(10),
    getTreeAnalysisHistory(10),
  ]);

  return NextResponse.json({ locations, treeAnalyses });
}
