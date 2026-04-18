import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://bench.app", lastModified: new Date() },
    { url: "https://bench.app/pricing", lastModified: new Date() },
  ];
}
