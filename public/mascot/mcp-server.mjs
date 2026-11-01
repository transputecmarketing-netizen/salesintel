#!/usr/bin/env node
/* Blue Cap mascot MCP server. No dependencies.
 *
 * An MCP client (Claude Desktop, Claude Code, any agent) talks to this process
 * over stdio. Each tool call is relayed to the browser page that shows the
 * mascot, which runs it on the live rig and sends the result back.
 *
 *   node public/mascot/mcp-server.mjs            # then open http://localhost:4545
 *
 * Claude Code:
 *   claude mcp add mascot -- node /absolute/path/public/mascot/mcp-server.mjs
 *
 * Any page can join instead of the bundled demo:
 *   const rig = Mascot.mount(el); Mascot.connect(rig, "http://localhost:4545");
 *
 * stdout carries only JSON-RPC; logs go to stderr.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { tools: TOOLS } = require("./mascot.js");

const PORT = Number(process.env.MASCOT_PORT || 4545);
const CALL_TIMEOUT_MS = 60_000;
const log = (...a) => process.stderr.write(`[mascot] ${a.join(" ")}\n`);

// ------------------------------------------------------------ browser bridge
const pages = new Set();     // open SSE responses
const pending = new Map();   // call id -> { resolve, timer }
let nextId = 1;

function sendToPages(name, args) {
  if (!pages.size) {
    return Promise.resolve({
      ok: false,
      error: `No mascot page is connected. Open http://localhost:${PORT} in a browser, then try again.`
    });
  }
  const id = String(nextId++);
  const payload = `data: ${JSON.stringify({ id, name, arguments: args })}\n\n`;
  for (const res of pages) res.write(payload);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ ok: false, error: "The mascot page did not answer in time." });
    }, CALL_TIMEOUT_MS);
    pending.set(id, { resolve, timer });
  });
}

const STATIC = {
  "/": ["demo.html", "text/html; charset=utf-8"],
  "/mascot.js": ["mascot.js", "text/javascript; charset=utf-8"],
  "/mascot.svg": ["mascot.svg", "image/svg+xml"]
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/events" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(": connected\n\n");
    pages.add(res);
    log(`page connected (${pages.size} open)`);
    const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
    req.on("close", () => { clearInterval(ping); pages.delete(res); log(`page left (${pages.size} open)`); });
    return;
  }

  if (url.pathname === "/result" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try {
        const { id, result } = JSON.parse(body);
        const waiter = pending.get(String(id));
        // With several tabs open, the first answer wins.
        if (waiter) { clearTimeout(waiter.timer); pending.delete(String(id)); waiter.resolve(result); }
      } catch (_) { /* ignore malformed posts */ }
      res.writeHead(204).end();
    });
    return;
  }

  const file = STATIC[url.pathname];
  if (file && req.method === "GET") {
    fs.readFile(path.join(here, file[0]), (err, data) => {
      if (err) { res.writeHead(404).end("Not found"); return; }
      res.writeHead(200, { "Content-Type": file[1] }).end(data);
    });
    return;
  }
  res.writeHead(404).end("Not found");
});

server.on("error", (err) => log(`bridge error: ${err.message}`));
server.listen(PORT, "127.0.0.1", () => log(`open http://localhost:${PORT} to see the mascot`));

// ------------------------------------------------------------ MCP over stdio
const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
const replyError = (id, code, message) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");

async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;
  switch (method) {
    case "initialize":
      return reply(id, {
        protocolVersion: params?.protocolVersion || "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "blue-cap-mascot", version: "1.0.0" },
        instructions:
          "Drives an animated line-art mascot in a browser page. Use mascot_say to talk (lip sync), " +
          "mascot_express and mascot_gesture for body language, mascot_perform for timed sequences, " +
          "and mascot_set with mascot_list_params for direct control of individual points."
      });
    case "ping":
      return isRequest && reply(id, {});
    case "tools/list":
      return reply(id, { tools: TOOLS });
    case "tools/call": {
      const name = params?.name;
      if (!TOOLS.some((t) => t.name === name)) {
        return reply(id, { content: [{ type: "text", text: `Unknown tool "${name}".` }], isError: true });
      }
      const result = await sendToPages(name, params?.arguments || {});
      return reply(id, { content: [{ type: "text", text: JSON.stringify(result) }], isError: result?.ok === false });
    }
    default:
      if (isRequest) replyError(id, -32601, `Method not found: ${method}`);
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch (_) { replyError(null, -32700, "Parse error"); continue; }
    handle(msg).catch((err) => msg.id != null && replyError(msg.id, -32603, String(err?.message || err)));
  }
});
process.stdin.on("end", () => { server.close(); process.exit(0); });
