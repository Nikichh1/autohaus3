import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge gate for /admin (Next.js "proxy" convention, formerly middleware). This is
 * an optimistic cookie check only — the real, DB-backed authorization (and role
 * checks) happen in the protected layout via requireUser(). Keeping the heavy
 * check out of the edge keeps navigation fast.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // The login page must stay reachable without a session.
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(req, { cookiePrefix: "autohaus" });

  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
