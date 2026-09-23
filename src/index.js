import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

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
  root: baremuxPath,
  prefix: "/baremux/",
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
