import type { NextConfig } from "next";

const publicStorageUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.trim() || (
  process.env.AWS_ENDPOINT_URL_S3 && process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES
    ? `${process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/, "")}/${encodeURIComponent(process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES)}`
    : undefined
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://accounts.google.com" },
      // Validate third-party destinations in staging before enforcing scripts.
      { key: "Content-Security-Policy-Report-Only", value: "script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" },
    ] }];
  },
  env: publicStorageUrl ? { NEXT_PUBLIC_S3_PUBLIC_URL: publicStorageUrl } : {},
  reactCompiler: true,
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/cron/transcode": ["./node_modules/ffmpeg-static/ffmpeg*"],
  },
  experimental: {
    cpus: 2,
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "stream-chat-react"
    ]
  },
  images: {
    minimumCacheTTL: 31536000,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      ...(publicStorageUrl
        ? [new URL(`${publicStorageUrl.replace(/\/$/, "")}/**`)]
        : []),
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  }
};

export default nextConfig;
