import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output);

const pages = [
  "index.html",
  "01_calculadora_simples.html",
  "02_lista_de_tarefas.html",
  "03_rel_gio_digital.html",
  "04_gerador_de_senhas.html",
  "05_jogo_da_velha.html",
  "06_cronometro.html",
];
const headers = await readFile(new URL("../_headers", import.meta.url), "utf8");
const csp = headers.match(
  /^  Content-Security-Policy: (.+); frame-ancestors 'none'$/m,
)?.[1];
if (!csp) throw new Error("Missing enforceable CSP in _headers");

for (const page of pages) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), "utf8");
  const policy = html.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
  )?.[1];
  if (policy !== csp) throw new Error(`CSP mismatch in ${page}`);
  await writeFile(new URL(page, output), html);
}

const source = new URL("../src/", import.meta.url);
for (const directory of await readdir(source, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const folder = new URL(`${directory.name}/`, source);
  const destination = new URL(`src/${directory.name}/`, output);
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(css|js)$/.test(entry.name)) continue;
    await cp(new URL(entry.name, folder), new URL(entry.name, destination));
  }
}

await writeFile(new URL("_headers", output), headers);
console.log(`Built ${pages.length} static pages in dist/`);
