const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function reviewPath(token: string) {
  return isGitHubPages ? `/review/?token=${encodeURIComponent(token)}` : `/r/${token}`;
}

export function showPath(id: string) {
  return isGitHubPages ? `/dashboard/shows/view/?id=${encodeURIComponent(id)}` : `/dashboard/shows/${id}`;
}

export function absoluteAppUrl(path: string) {
  return `${window.location.origin}${basePath}${path}`;
}

export function isReviewPath(path: string) {
  return path.startsWith("/r/") || path.startsWith("/review?");
}
