import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  async redirects() {
    return [{ source: "/", destination: "/invoices", permanent: false }];
  },
};

export default nextConfig;
