import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const siteUrl = "https://derivastudio.cl";

// Subdomains that must NOT be indexed by search engines.
// app.* = customer companion (user-private)
// staff.* = staff console (operator-private)
// admin.* = admin console (admin-private)
const PRIVATE_HOST_PREFIXES = ["app.", "staff.", "admin."];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  const isPrivateHost = PRIVATE_HOST_PREFIXES.some((prefix) =>
    host.startsWith(prefix)
  );

  if (isPrivateHost) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/"
        }
      ]
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
