import type { MetadataRoute } from "next";

const siteUrl = "https://derivastudio.cl";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/menu`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/resenas`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${siteUrl}/privacidad`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
