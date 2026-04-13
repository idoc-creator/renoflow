import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://renoflow.app", lastModified: new Date() },
    { url: "https://renoflow.app/pricing", lastModified: new Date() },
  ];
}
