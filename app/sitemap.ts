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
      url: `${siteUrl}/mundial`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.6
    },
    {
      // Limited campaign — drops out of the sitemap after 2026-06-30.
      url: `${siteUrl}/deriva-match-up`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.6
    },
    {
      url: `${siteUrl}/deriva-match-up/bases`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3
    },
    {
      url: `${siteUrl}/privacidad`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
