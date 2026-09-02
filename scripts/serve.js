import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT ?? 4173);
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const requested = normalize(join(root, pathname === "/" ? "index.html" : pathname));
  if (!requested.startsWith(root) || !existsSync(requested) || statSync(requested).isDirectory()) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": `${types[extname(requested)] ?? "application/octet-stream"}; charset=utf-8`, "cache-control": "no-store" });
  createReadStream(requested).pipe(response);
}).listen(port, () => console.log(`WellSet running at http://localhost:${port}`));
