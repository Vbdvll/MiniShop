import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const supabase = await createClient();
  const { data: shops } = await supabase
    .from("shops")
    .select("slug, updated_at")
    .eq("status", "published");

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/marche`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...(shops ?? []).map((shop) => ({
      url: `${siteUrl}/${shop.slug}`,
      lastModified: new Date(shop.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
