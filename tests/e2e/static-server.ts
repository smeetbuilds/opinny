const root = `${process.cwd()}/out`;
const port = Number(process.env.PORT ?? 4173);

function candidatePaths(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const clean = decoded.replace(/^\/+/, "");
  if (!clean) return [`${root}/index.html`];
  if (decoded.endsWith("/")) return [`${root}/${clean}index.html`];
  return [`${root}/${clean}`, `${root}/${clean}/index.html`];
}

Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    const url = new URL(request.url);
    for (const path of candidatePaths(url.pathname)) {
      if (!path.startsWith(root)) return new Response("Not found", { status: 404 });
      const file = Bun.file(path);
      if (await file.exists()) {
        return new Response(request.method === "HEAD" ? null : file, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": file.type || "application/octet-stream"
          }
        });
      }
    }
    return new Response("Not found", { status: 404 });
  }
});

console.log(`Serving static export at http://127.0.0.1:${port}`);
