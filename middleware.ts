import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const privatePrefixes = [
  "/dashboard",
  "/pos",
  "/kds",
  "/orders",
  "/settings",
  "/inventory",
  "/accounting",
  "/customers",
  "/tables",
  "/reservations",
  "/reports",
  "/team",
  "/attendance",
  "/marketing",
  "/agent",
  "/delivery",
  "/franchise",
  "/approvals",
  "/operations",
  "/login",
  "/kiosk",
  "/guest",
  "/order",
  "/customer-display",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hidden = privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const response = NextResponse.next();
  if (hidden) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/pos",
    "/pos/:path*",
    "/kds",
    "/kds/:path*",
    "/orders",
    "/orders/:path*",
    "/settings",
    "/settings/:path*",
    "/inventory",
    "/inventory/:path*",
    "/accounting",
    "/accounting/:path*",
    "/customers",
    "/customers/:path*",
    "/tables",
    "/tables/:path*",
    "/reservations",
    "/reservations/:path*",
    "/reports",
    "/reports/:path*",
    "/team",
    "/team/:path*",
    "/attendance",
    "/attendance/:path*",
    "/marketing",
    "/marketing/:path*",
    "/agent",
    "/agent/:path*",
    "/delivery",
    "/delivery/:path*",
    "/franchise",
    "/franchise/:path*",
    "/approvals",
    "/approvals/:path*",
    "/operations",
    "/operations/:path*",
    "/login",
    "/kiosk/:path*",
    "/guest/:path*",
    "/order/:path*",
    "/customer-display",
    "/customer-display/:path*",
  ],
};
