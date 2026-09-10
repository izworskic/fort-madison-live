import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const b="https://chrisizworski.com/national-tools/fort-madison-live";return [{url:`${b}/`,changeFrequency:"hourly",priority:1},{url:`${b}/methodology`,changeFrequency:"monthly",priority:.5}];}
