import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const githubBase = process.env.GITHUB_PAGES_BASE || (repoName ? `/${repoName}/` : "/");

export default defineConfig({
  base: githubBase,
  plugins: [react()],
});
