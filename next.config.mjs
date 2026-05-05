/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force-bundle runtime-read files into the serverless function package.
  // Without this, Vercel's outputFileTracing only ships statically-imported
  // files. lib/server/skill-md/*.md is read at runtime via fs.readFileSync,
  // so the bundler doesn't see the imports and skips the files. Result:
  // Live executor calls fail with ENOENT on Vercel even though the files
  // exist in the git repo.
  outputFileTracingIncludes: {
    "/api/pipeline/run": [
      "./lib/server/skill-md/**/*",
      "./state/jtbd-catalog.json",
    ],
    "/api/pipeline/stage/[stage]": [
      "./lib/server/skill-md/**/*",
      "./state/jtbd-catalog.json",
    ],
    "/api/pipeline/init": ["./state/jtbd-catalog.json"],
    "/api/archetypes/[id]": ["./state/jtbd-catalog.json"],
    "/api/jtbds": ["./state/jtbd-catalog.json"],
    "/api/brain/[merchant]": ["./state/jtbd-catalog.json"],
    "/": ["./state/jtbd-catalog.json"],
  },
};

export default nextConfig;
