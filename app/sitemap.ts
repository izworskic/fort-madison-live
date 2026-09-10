import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const b=process.env.NEXT_PUBLIC_SITE_URL||"https://fort-madison-live.vercel.app";return [{url:b,changeFrequency:"hourly",priority:1},{url:`${b}/methodology`,changeFrequency:"monthly",priority:.5}];}
