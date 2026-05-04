import { MetadataRoute } from "next";
import { getPeliculasEnCartelera } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://cineworld.com.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const peliculas = await getPeliculasEnCartelera();

  const peliculasUrls = peliculas.map((p) => ({
    url: `${BASE_URL}/pelicula/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...peliculasUrls,
  ];
}
