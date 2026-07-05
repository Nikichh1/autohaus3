import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep trailing slashes so canonical URLs match the existing internal links.
  trailingSlash: true,
  // ...but do NOT 308-redirect requests that omit the slash. Without this, POSTs
  // to the Better Auth API (/api/auth/*) get redirected and can lose their body.
  // Public pages still generate trailing-slash links, so canonical URLs are unchanged.
  skipTrailingSlashRedirect: true,
  // Custom loader → responsive srcset from our PRE-GENERATED width variants
  // (scripts/gen-variants.mjs). Next never re-encodes; the full-res base files
  // stay exactly as graded. Phones fetch a right-sized variant.
  images: {
    loaderFile: "./image-loader.ts",
    deviceSizes: [640, 828, 1080, 1920, 2560],
    // Next 16 requires every `quality` value used by <Image> to be declared.
    qualities: [75, 88, 90, 92],
  },
  // Pin Turbopack to this project (avoids picking up an unrelated lockfile in the user's home)
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // Tree-shake large barrel packages so only the icons/exports actually used ship.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Long-lived caching for immutable image/frame assets — repeat visits avoid
  // re-downloading the (stable-named) photography and scroll-frame sequences.
  async headers() {
    const cache = [
      { key: "Cache-Control", value: "public, max-age=31536000" },
    ];
    return [
      { source: "/photos/:path*", headers: cache },
      { source: "/cars/:path*", headers: cache },
      { source: "/intro/:path*", headers: cache },
      { source: "/feature/:path*", headers: cache },
      { source: "/brand/:path*", headers: cache },
    ];
  },
};

export default nextConfig;
