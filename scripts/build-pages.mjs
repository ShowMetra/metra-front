import { mkdir, rename, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const hiddenRoot = new URL("../.pages-build-hidden/", import.meta.url);
const dynamicRoutes = [
  [new URL("../src/app/r/[token]/", import.meta.url), new URL("r-token/", hiddenRoot)],
  [new URL("../src/app/dashboard/shows/[id]/", import.meta.url), new URL("show-id/", hiddenRoot)],
];

await rm(hiddenRoot, { recursive: true, force: true });
await mkdir(hiddenRoot, { recursive: true });

try {
  for (const [source, destination] of dynamicRoutes) await rename(source, destination);
  const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, BUILD_GITHUB_PAGES: "true" },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else await import("./write-pages-404.mjs");
} finally {
  for (const [source, destination] of dynamicRoutes.reverse()) await rename(destination, source);
  await rm(hiddenRoot, { recursive: true, force: true });
}
