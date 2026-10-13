import { writeFile } from "node:fs/promises";

const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Opening ShowMetra…</title></head>
<body>
<script>
  const path = location.pathname;
  const reviewMatch = path.match(/^\\/r\\/([^/]+)\\/?$/);
  const showMatch = path.match(/^\\/dashboard\\/shows\\/([^/]+)\\/?$/);
  let target = "/";
  if (reviewMatch) target = "/review/?token=" + encodeURIComponent(decodeURIComponent(reviewMatch[1]));
  else if (showMatch) target = "/dashboard/shows/view/?id=" + encodeURIComponent(decodeURIComponent(showMatch[1]));
  location.replace(target);
</script>
</body>
</html>`;

await writeFile(new URL("../out/404.html", import.meta.url), html);
