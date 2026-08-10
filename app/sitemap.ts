import type { MetadataRoute } from "next";

const siteUrl = "https://derivastudio.cl";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/menu`,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/resenas`,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${siteUrl}/privacidad`,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
