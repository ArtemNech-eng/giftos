import { NextResponse, type NextRequest } from "next/server";

export function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return params.then(({ code }) => {
    const referralCode = code.toLowerCase();
    const city = request.nextUrl.searchParams.get("city");
    // Show the invite on the public landing first: the recipient can see the
    // actual public residents of the city before deciding to join. Attribution
    // is persisted in cookies, so it survives the sign-in and onboarding flow.
    const landingUrl = new URL("/", request.url);
    landingUrl.searchParams.set("invite", referralCode);
    if (city) landingUrl.searchParams.set("city", city);
    const response = NextResponse.redirect(landingUrl);
    // Keep the redirect same-origin even in a proxied dev preview, where
    // request.url can contain the internal 0.0.0.0 listener host.
    response.headers.set("Location", `${landingUrl.pathname}${landingUrl.search}`);
    response.cookies.set("ht_ref", referralCode, {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
    if (city) {
      response.cookies.set("ht_city", city, {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  });
}
