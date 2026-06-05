import defineConfig from "@plasmohq/parcel-runtime";

export default defineConfig({
  permissions: ["storage", "clipboardWrite", "clipboardRead", "tabs", "scripting"],
  host_permissions: ["https://ahrefs.com/*", "https://*.toolwaly.com/*"]
});
