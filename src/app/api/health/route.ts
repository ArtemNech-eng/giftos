import { NextResponse } from "next/server";

import { hasSupabaseEnvironment } from "@/lib/supabase/env";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "giftos-web",
    supabaseConfigured: hasSupabaseEnvironment(),
  });
}
