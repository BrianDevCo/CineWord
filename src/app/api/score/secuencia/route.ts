import { NextResponse } from "next/server";
import { scoreGetSecuencia } from "@/lib/score";

export async function GET() {
  try {
    const data = await scoreGetSecuencia();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
