import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/settings", "/login", "/register", "/verify-request", "/verification", "/home", "/chat", "/bookmark", "/notifications", "/subscription", "/trade-room", "/academy", "/profile", "/posts", "/dashboard"] }, sitemap: new URL("/sitemap.xml", base).href };
}
