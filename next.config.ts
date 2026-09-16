import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true" || process.env.BUILD_GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/metra-front" : "";

const nextConfig: NextConfig = {
  ...(isGitHubPages ? {
    output: "export",
    trailingSlash: true,
    basePath,
    assetPrefix: basePath,
  } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_GITHUB_PAGES: isGitHubPages ? "true" : "false",
  },
};

export default nextConfig;
