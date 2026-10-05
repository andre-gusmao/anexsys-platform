import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const backendOrigin = (process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
