import { writeFile } from "node:fs/promises";

const basePath = "/metra-front";
const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Opening ShowMetra…</title></head>
<body>
<script>
  const base = ${JSON.stringify(basePath)};
  const path = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname;
  const reviewMatch = path.match(/^\\/r\\/([^/]+)\\/?$/);
  const showMatch = path.match(/^\\/dashboard\\/shows\\/([^/]+)\\/?$/);
  let target = base + "/";
  if (reviewMatch) target = base + "/review/?token=" + encodeURIComponent(decodeURIComponent(reviewMatch[1]));
  else if (showMatch) target = base + "/dashboard/shows/view/?id=" + encodeURIComponent(decodeURIComponent(showMatch[1]));
  location.replace(target);
</script>
</body>
</html>`;

await writeFile(new URL("../out/404.html", import.meta.url), html);
