import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Host tambahan untuk akses dev (pisahkan dengan koma), mis. domain proxy/sandbox
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",") ?? [],
  // Kompatibilitas URL frontend lama (link pembayaran yang sudah tersebar memakai /pay.html?invoice=...)
  async redirects() {
    return [
      {
        source: "/pay.html",
        has: [{ type: "query", key: "invoice", value: "(?<invoice>.+)" }],
        destination: "/pay/:invoice",
        permanent: true,
      },
      { source: "/docs.html", destination: "/docs", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
