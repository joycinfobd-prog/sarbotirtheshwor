import type { NextConfig } from "next";

// Secret admin login URL. Change ADMIN_LOGIN_PATH here or via env to hide it.
const ADMIN_LOGIN_PATH = process.env.ADMIN_LOGIN_PATH || "x9-manager";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Nothing here — /admin/login stays accessible only when the secret
      // path lands on it via rewrite below.
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Direct /admin/login URL → hidden, show the public site instead.
        {
          source: "/admin/login",
          destination: "/",
        },
        {
          source: "/admin/login/:path*",
          destination: "/",
        },
        // Secret admin login URL → serve the real login page.
        {
          source: `/${ADMIN_LOGIN_PATH}`,
          destination: "/admin/login",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: `/(${ADMIN_LOGIN_PATH}|admin|api)/:path*`,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
