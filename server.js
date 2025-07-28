import express from "express";
import { createServer } from "node:http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { join } from "node:path";
import { hostname } from "node:os";
import wisp from "wisp-server-node"

const app = express();
app.get('/api/theme', (req, res) => {
    res.json({
        light: {
            back: "rgb(230, 230, 230)",
            font: "black",
            tile: "rgb(210, 210, 210)",
            res: "rgb(56, 56, 56)",
            themeicon: "white",
            grid: "rgb(189, 189, 189)",
            icon: "dark_mode"
        },
        dark: {
            back: "rgba(11, 11, 11, 1)",
            font: "white",
            tile: "rgba(15, 15, 15, 1)",
            res: "rgb(230, 230, 230)",
            themeicon: "black",
            grid: "rgba(28, 28, 28, 1)",
            icon: "light_mode"
        }
    });
});
app.use(express.static("games"));
// Serve your own /public directory first
app.use("/ppfn-unblocker/", express.static(join(process.cwd(), "proxy/public")));

// Load our publicPath first and prioritize it over UV.
app.use(express.static(publicPath));
// Load vendor files last.
// The vendor's uv.config.js won't conflict with our uv.config.js inside the publicPath directory.
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

// Serve custom favicon before static
app.get('/favicon.ico', (req, res) => {
  res.sendFile(join(publicPath, 'favicon.ico'));
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  app(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/"))
    wisp.routeRequest(req, socket, head);
  else
    socket.end();
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();

  // by default we are listening on 0.0.0.0 (every interface)
  // we just need to list a few
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(
    `\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

// https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  process.exit(0);
}

server.listen({
  port,
});