import { createServer } from "node:http";
import { access, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";

const require = createRequire(import.meta.url);
const packagePath = (specifier) => path.dirname(require.resolve(specifier));
const controllerPath = packagePath("@mercuryworkshop/scramjet-controller");
const utilsPath = packagePath("@mercuryworkshop/scramjet-utils");
const libcurlPath = packagePath("@mercuryworkshop/libcurl-transport");
const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const gamesPath = fileURLToPath(new URL("../games/", import.meta.url));

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  dns_servers: ["1.1.1.3", "1.0.0.3"],
});

const app = Fastify({
  serverFactory: (handler) =>
    createServer()
      .on("request", (request, response) => {
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        handler(request, response);
      })
      .on("upgrade", (request, socket, head) => {
        if (request.url?.endsWith("/wisp/")) wisp.routeRequest(request, socket, head);
        else socket.end();
      }),
});

await app.register(fastifyStatic, { root: publicPath });
const gamesAvailable = await access(gamesPath).then(
  () => true,
  (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  },
);
if (gamesAvailable) {
  await app.register(fastifyStatic, {
    root: gamesPath,
    prefix: "/games/",
    decorateReply: false,
  });
}

const gameLibrary = gamesAvailable
  ? readdir(gamesPath, { withFileTypes: true }).then(async (entries) => {
    const games = await Promise.all(entries
      .filter((entry) => entry.isDirectory() && /^[a-z0-9_-]+$/i.test(entry.name))
      .map(async (entry) => {
        try {
          await access(path.join(gamesPath, entry.name, "index.html"), fsConstants.R_OK);
          return {
            id: entry.name,
            name: entry.name.split(/[-_]+/).map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" "),
          };
        } catch {
          return null;
        }
      }));
    return games.filter(Boolean).sort((first, second) => first.name.localeCompare(second.name));
  })
  : Promise.resolve([]);
app.get("/api/games", async (_request, reply) => {
  reply.header("Cache-Control", "no-store").send(await gameLibrary);
});
await app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
});
await app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false,
});
await app.register(fastifyStatic, {
  root: controllerPath,
  prefix: "/controller/",
  decorateReply: false,
});
await app.register(fastifyStatic, {
  root: utilsPath,
  prefix: "/utils/",
  decorateReply: false,
});

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
await app.listen({ port: Number.isNaN(port) ? 8080 : port, host: "0.0.0.0" });

const address = app.server.address();
console.log(`x3onra1n is running at http://localhost:${typeof address === "object" && address ? address.port : port}`);
console.log(`Also available on ${hostname()}`);

const shutdown = async () => {
  await app.close();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
