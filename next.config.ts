import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Foto e CV arrivano via Server Action: il default di 1 MB e' troppo
      // poco. Restiamo sotto i 4,5 MB che Vercel accetta per richiesta
      // (file da max 4 MB + margine per l'overhead del multipart).
      bodySizeLimit: "4.4mb",
    },
  },
};

export default withSerwist(nextConfig);
