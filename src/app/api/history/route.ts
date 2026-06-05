import { NextResponse } from "next/server";
import { getRecentLocations, getTreeAnalysisHistory } from "@/lib/db";

const HISTORY_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(fallback), HISTORY_TIMEOUT_MS);
    promise
      .then(value => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timeout));
  });
}

export async function GET() {
  const [locations, treeAnalyses] = await withTimeout(
    Promise.all([
      getRecentLocations(10),
      getTreeAnalysisHistory(10),
    ]),
    [[], []],
  );

  return NextResponse.json({ locations, treeAnalyses });
}
