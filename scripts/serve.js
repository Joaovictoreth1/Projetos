import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname } from "node:path";

const output = new URL("../dist/", import.meta.url);
const config = await readFile(new URL("_headers", output), "utf8");
const headers = Object.fromEntries(
  config
    .split("\n")
    .filter((line) => line.startsWith("  "))
    .map((line) => {
      const separator = line.indexOf(":");
      return [line.slice(2, separator), line.slice(separator + 1).trim()];
    }),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { ...headers, Allow: "GET, HEAD" }).end();
    return;
  }

  const path = request.url?.split("?")[0];
  const file = path === "/" ? "/index.html" : path;
  if (
    !file ||
    !/^\/(?:favicon\.svg|[\w]+\.html|src\/[\w-]+\/[\w-]+\.(?:css|js))$/.test(
      file,
    )
  ) {
    response.writeHead(404, headers).end();
    return;
  }

  try {
    const body = await readFile(new URL(file.slice(1), output));
    response.writeHead(200, {
      ...headers,
      "Content-Type": types[extname(file)],
      "Content-Length": body.length,
    });
    response.end(request.method === "GET" ? body : undefined);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, headers).end();
  }
}).listen(4173, "127.0.0.1", () => console.log("http://127.0.0.1:4173"));
