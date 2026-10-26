import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initialPlaces, fromRow } from "@/lib/places";
export const dynamic = "force-dynamic";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return NextResponse.json({ source: "research", places: initialPlaces });
  try {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await db
      .from("places")
      .select("*")
      .eq("published", true)
      .order("name")
      .limit(500);
    if (error)
      return NextResponse.json(
        { error: "Campus database is unavailable. Please try again later." },
        { status: 503 },
      );
    return NextResponse.json({
      source: "supabase",
      places: (data || []).map(fromRow),
    });
  } catch {
    return NextResponse.json(
      { error: "Campus database is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
