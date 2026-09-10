import type { NextConfig } from "next";

const nationalPrefix = "/national-tools/fort-madison-live";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  assetPrefix: nationalPrefix,
  async rewrites() {
    return [
      {
        source: `${nationalPrefix}/_next/:path*`,
        destination: "/_next/:path*",
      },
    ];
  },
};

export default nextConfig;
