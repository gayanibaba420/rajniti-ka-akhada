import { getBreakingNewsItems } from "@/lib/articles";
import { handleApiError } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getBreakingNewsItems();
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return handleApiError(error);
  }
}
