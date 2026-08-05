import { NextResponse, type NextRequest } from "next/server";

export function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return params.then(({ code }) => {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("ref", code.toLowerCase());
    const response = NextResponse.redirect(url);
    response.cookies.set("ht_ref", code.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
    return response;
  });
}
