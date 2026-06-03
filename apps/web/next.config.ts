import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
      {
        source: "/auth/reset",
        destination: "/en/auth/reset-password",
        permanent: false,
      },
      {
        source: "/track/:referenceNo",
        destination: "/en/complaints/track",
        permanent: false,
      },
      {
        source: "/:locale(en|am)/login",
        destination: "/:locale/auth/login",
        permanent: true,
      },
      {
        source: "/:locale(en|am)/submit",
        destination: "/:locale/complaints/new",
        permanent: true,
      },
      {
        source: "/:locale(en|am)/track",
        destination: "/:locale/complaints/track",
        permanent: true,
      },
      {
        source: "/:locale(en|am)/app",
        destination: "/:locale/dashboard",
        permanent: true,
      },
      {
        source: "/:locale(en|am)/session-expired",
        destination: "/:locale/auth/session-expired",
        permanent: true,
      },
      {
        source: "/:locale(en|am)/reset-password",
        destination: "/:locale/auth/reset-password",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
