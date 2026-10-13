const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

export function reviewPath(token: string) {
  return isGitHubPages ? `/review/?token=${encodeURIComponent(token)}` : `/r/${token}`;
}

export function showPath(id: string) {
  return isGitHubPages ? `/dashboard/shows/view/?id=${encodeURIComponent(id)}` : `/dashboard/shows/${id}`;
}

export function absoluteAppUrl(path: string) {
  return `${window.location.origin}${path}`;
}

export function isReviewPath(path: string) {
  return path.startsWith("/r/") || path.startsWith("/review?") || path.startsWith("/review/?");
}
