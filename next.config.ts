import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true" || process.env.BUILD_GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages ? {
    output: "export",
    trailingSlash: true,
  } : {}),
  env: {
    NEXT_PUBLIC_GITHUB_PAGES: isGitHubPages ? "true" : "false",
  },
};

export default nextConfig;
