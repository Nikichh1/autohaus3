import type { MetadataRoute } from "next";
import { getPublicSlugs } from "@/lib/data/vehicles";
import { allServices } from "@/data/services";

export const dynamic = "force-dynamic";

const BASE_URL = "https://autohaus.bg";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublicSlugs();
  const staticRoutes = ["", "/avtomobili", "/kontakti"].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const serviceRoutes = allServices
    .filter((s) => s.slug !== "avtomobili")
    .map((s) => ({
      url: `${BASE_URL}/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const vehicleRoutes = slugs.map((slug) => ({
    url: `${BASE_URL}/avtomobili/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...serviceRoutes, ...vehicleRoutes];
}
