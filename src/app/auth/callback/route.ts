import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/onboarding";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const referralCode = request.cookies.get("ht_ref")?.value;
        if (user && referralCode) {
          try {
            const admin = createAdminClient();
            const { data: referrer } = await admin
              .from("referral_codes")
              .select("owner_id, code")
              .eq("code", referralCode)
              .eq("is_active", true)
              .maybeSingle();
            if (referrer && referrer.owner_id !== user.id) {
              await admin.from("referrals").upsert(
                {
                  referrer_id: referrer.owner_id,
                  referee_id: user.id,
                  referral_code: referrer.code,
                  status: "registered",
                },
                { onConflict: "referee_id" },
              );
            }
          } catch {
            // Referral attribution must never block a successful sign-in.
          }
        }
        const response = NextResponse.redirect(new URL(next, url.origin));
        response.cookies.delete("ht_ref");
        return response;
      }
    } catch {
      // The project is not connected yet or code exchange failed.
    }
  }

  return NextResponse.redirect(new URL("/auth/error", url.origin));
}
