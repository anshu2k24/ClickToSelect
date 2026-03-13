# NODE.JS — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: Core Runtime · Event Loop · Async Patterns · Streams · File System · HTTP · Express · Fastify · Databases · Authentication · Testing · Performance · Security · Microservices · Deployment · TypeScript

---

# SECTION 1 · CORE RUNTIME & MODULE SYSTEM

> `[JUNIOR]` CommonJS, built-in modules, process object  
> `[MID]` ES Modules, module resolution, circular deps  
> `[SENIOR]` Module caching, dynamic imports, custom loaders

---

## 1.1 Module Systems

```js
// ─── CommonJS (CJS) — default in Node.js ─────────────────────────────────────
// Synchronous, runtime evaluation, mutable exports

// Exporting
const PI = 3.14159;
function add(a, b) { return a + b; }
class Calculator { /* ... */ }

module.exports = { PI, add, Calculator };        // named exports object
module.exports = Calculator;                      // single default export
exports.add = add;                                // shorthand — same as module.exports.add

// Importing
const { add, PI } = require("./math");            // named
const Calculator  = require("./Calculator");      // default
const path        = require("path");              // built-in
const express     = require("express");           // npm package

// require() is synchronous — blocks event loop (acceptable at startup, not runtime)
// require() caches modules — subsequent calls return cached exports

// ─── ES Modules (ESM) — modern Node.js ───────────────────────────────────────
// Enable via: package.json "type": "module", or .mjs extension

// Exporting
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export default class Calculator { /* ... */ }

// Importing
import { add, PI } from "./math.js";              // MUST include .js extension in ESM
import Calculator  from "./Calculator.js";
import * as math   from "./math.js";              // namespace import
import path        from "path";                   // built-in
import { createRequire } from "module";

// Dynamic import — works in both CJS and ESM, returns Promise
const module = await import("./heavyModule.js");
const { feature } = await import(`./plugins/${name}.js`);

// Interop
// ESM can import CJS (with limitations — only default export available)
import cjsModule from "./legacy.cjs";             // gets module.exports as default

// CJS cannot directly require() ESM files
// Workaround: dynamic import inside async function
async function loadESM() {
  const { fn } = await import("./esmModule.mjs");
  return fn;
}

// package.json — control module type
{
  "type": "module",          // .js files treated as ESM
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

---

## 1.2 Module Resolution and Caching

```js
// Module resolution order for require("x"):
// 1. Core modules (path, fs, http, etc.) — returned immediately
// 2. If starts with ./ or ../ — relative file resolution
//    a. exact path
//    b. path + .js, .json, .node
//    c. path/index.js, path/index.json, path/index.node
// 3. node_modules lookup — walks up directory tree
//    ./node_modules → ../node_modules → ../../node_modules → ...

// Module cache — require.cache
console.log(require.cache);          // object of all loaded modules
delete require.cache[require.resolve("./config")]; // invalidate cache (hot reload pattern)

// Circular dependencies — CJS handles gracefully (returns partial export)
// a.js: const b = require('./b'); module.exports.done = true;
// b.js: const a = require('./a'); // a.done is undefined here — circular!
// Solution: require inside functions, dependency injection, or restructure

// __filename and __dirname — CJS only
console.log(__filename);  // /home/user/app/server.js
console.log(__dirname);   // /home/user/app

// ESM equivalent
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// import.meta — ESM metadata
import.meta.url        // file URL of current module
import.meta.resolve("./dep.js")  // resolve module URL

// Conditional exports — expose different files by condition
{
  "exports": {
    ".": {
      "node":    "./dist/node.js",
      "browser": "./dist/browser.js",
      "default": "./dist/index.js"
    }
  }
}
```

---

## 1.3 Process and Global Objects

```js
// process — information and control over current Node.js process

// Environment
process.env.NODE_ENV          // "development" | "production" | "test"
process.env.PORT              // custom env vars
process.argv                  // ["node", "script.js", "--flag", "value"]
process.cwd()                 // current working directory
process.chdir("/new/dir")     // change working directory
process.version               // "v20.11.0"
process.platform              // "linux" | "darwin" | "win32"
process.arch                  // "x64" | "arm64"
process.pid                   // process ID
process.ppid                  // parent process ID
process.memoryUsage()         // { rss, heapTotal, heapUsed, external, arrayBuffers }
process.cpuUsage()            // { user, system } in microseconds
process.uptime()              // seconds since process started
process.hrtime.bigint()       // nanosecond precision timer

// Streams
process.stdin                 // Readable
process.stdout                // Writable
process.stderr                // Writable
process.stdout.write("hello\n");  // non-blocking write

// Exit
process.exit(0)               // 0 = success, 1 = failure — avoid in libraries
process.exitCode = 1          // set exit code without immediate exit
process.on("exit", (code) => { /* synchronous only — no async here */ });

// Signals
process.on("SIGTERM", () => { gracefulShutdown(); });
process.on("SIGINT",  () => { gracefulShutdown(); });   // Ctrl+C

// Uncaught errors — last resort; always handle errors properly
process.on("uncaughtException",       (err, origin) => { log(err); process.exit(1); });
process.on("unhandledRejection",      (reason, promise) => { log(reason); process.exit(1); });
process.on("uncaughtExceptionMonitor", (err, origin) => { /* monitor only, can't prevent exit */ });

// nextTick
process.nextTick(() => {
  // Runs before any I/O, before next event loop iteration
  // Use for: emit events after returning, ensure callback is async
});

// Global objects
global.myVar = "shared";      // global scope (avoid — use modules instead)
globalThis                    // works in both Node.js and browsers
queueMicrotask(() => {});     // microtask queue (same as Promise.resolve().then)
setImmediate(() => {});       // check phase of event loop
setTimeout(() => {}, 0);     // timers phase
```

---

# SECTION 2 · EVENT LOOP & ASYNC PATTERNS

> `[JUNIOR]` Callbacks, Promises, async/await  
> `[MID]` Event loop phases, microtasks vs macrotasks, Promise combinators  
> `[SENIOR]` Event loop internals, libuv, backpressure, async_hooks

---

## 2.1 Event Loop

```
Node.js Event Loop — powered by libuv

   ┌───────────────────────────────────────────────┐
   │              Event Loop Phases                │
   │                                               │
   │  ┌─────────┐    ┌──────────┐   ┌──────────┐ │
   │  │ timers  │───▶│ pending  │──▶│  idle,   │ │
   │  │         │    │callbacks │   │ prepare  │ │
   │  │setTimeout│   │(I/O errs)│   │(internal)│ │
   │  │setInterval│  └──────────┘   └──────────┘ │
   │  └─────────┘                        │        │
   │       ▲                             ▼        │
   │  ┌─────────┐    ┌──────────┐   ┌──────────┐ │
   │  │  close  │◀───│  check   │◀──│  poll    │ │
   │  │callbacks│    │          │   │          │ │
   │  │.on close│    │setImmed. │   │ I/O wait │ │
   │  └─────────┘    └──────────┘   └──────────┘ │
   └───────────────────────────────────────────────┘

Between EACH phase: microtask queue is drained completely
  1. process.nextTick callbacks (all of them)
  2. Promise microtasks (all of them)

Execution order:
1. Synchronous code
2. process.nextTick (all)
3. Promise microtasks (all)
4. setTimeout / setInterval (timers phase)
5. I/O callbacks (poll phase)
6. setImmediate (check phase)
7. close callbacks

setTimeout vs setImmediate order:
- Inside I/O callback: setImmediate ALWAYS before setTimeout(fn, 0)
- Outside I/O callback: order is non-deterministic (OS timer precision)
```

```js
// Execution order demonstration
console.log("1: sync");

process.nextTick(() => console.log("2: nextTick"));

Promise.resolve().then(() => console.log("3: Promise microtask"));

setImmediate(() => console.log("5: setImmediate"));

setTimeout(() => console.log("4 or 5: setTimeout(0)"), 0);

console.log("4: sync");

// Output:
// 1: sync
// 4: sync
// 2: nextTick
// 3: Promise microtask
// (setTimeout and setImmediate race outside I/O context)

// Inside I/O callback — setImmediate always wins
fs.readFile("file.txt", () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));  // ALWAYS first here
});

// Blocking the event loop — NEVER do this in production
// BAD: CPU-intensive work blocks all I/O
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);  // blocks for large n
}
app.get("/fib", (req, res) => res.json(fibonacci(45))); // kills server responsiveness

// Solutions for CPU work:
// 1. Worker threads (see Section 8)
// 2. Child processes
// 3. Offload to external service
// 4. Break into chunks with setImmediate
```

---

## 2.2 Callbacks to Promises

```js
// Callback pattern — error-first convention (Node.js standard)
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log(data);
});

// util.promisify — convert callback-style functions to Promises
import { promisify } from "util";
const readFile = promisify(fs.readFile);
const data = await readFile("file.txt", "utf8");

// fs/promises — modern Node.js built-in async versions
import { readFile, writeFile, mkdir } from "fs/promises";
const content = await readFile("config.json", "utf8");

// Promisify custom callback function
function delay(ms, callback) {
  setTimeout(() => callback(null, "done"), ms);
}
const delayAsync = promisify(delay);
const result = await delayAsync(1000);

// Manual Promise wrapping (when promisify doesn't work)
function connectDb(url) {
  return new Promise((resolve, reject) => {
    const conn = new DatabaseDriver(url);
    conn.on("connected", () => resolve(conn));
    conn.on("error",     (err) => reject(err));
  });
}

// Promise chains
fetch("/api/users")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(users => users.filter(u => u.active))
  .then(active => console.log(active))
  .catch(err => console.error("Failed:", err))
  .finally(() => console.log("Done"));

// async/await — syntactic sugar over Promises
async function loadUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    throw new UserLoadError(`Failed to load user ${id}`, { cause: err });
  }
}

// Error cause chaining (Node.js 16.9+)
throw new Error("Connection failed", { cause: originalError });
err.cause  // access underlying error
```

---

## 2.3 Promise Combinators

```js
// Promise.all — all or nothing; parallel; rejects on first failure
const [users, orders, products] = await Promise.all([
  fetchUsers(),
  fetchOrders(),
  fetchProducts(),
]);

// Promise.allSettled — wait for all, get results and rejections
const results = await Promise.allSettled([
  fetchUsers(),
  fetchOrders(),
  fetchProducts(),
]);
results.forEach(result => {
  if (result.status === "fulfilled") use(result.value);
  else log("Failed:", result.reason);
});

// Promise.race — first to settle (resolve OR reject) wins
const data = await Promise.race([
  fetchWithPrimaryServer(),
  fetchWithBackupServer(),
]);

// Promise.any — first to RESOLVE wins; rejects only if ALL reject
const fastest = await Promise.any([
  fetchFromRegion("us-east"),
  fetchFromRegion("eu-west"),
  fetchFromRegion("ap-south"),
]);

// Timeout pattern
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}
const data = await withTimeout(fetchUser(id), 5000);

// Retry with exponential backoff
async function withRetry(fn, { retries = 3, baseDelay = 100, factor = 2 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(factor, attempt);
        await new Promise(r => setTimeout(r, delay + Math.random() * 100));
      }
    }
  }
  throw lastError;
}

// Concurrency limiting — avoid overwhelming resources
async function processInBatches(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

// p-limit — popular library for concurrency control
import pLimit from "p-limit";
const limit = pLimit(5);  // max 5 concurrent
const results = await Promise.all(
  items.map(item => limit(() => processItem(item)))
);
```

---

## 2.4 Async Iteration

```js
// for await...of — iterate async iterables (streams, generators, async generators)
import { createReadStream } from "fs";
import { createInterface } from "readline";

// Read file line by line
const rl = createInterface({
  input: createReadStream("large-file.txt"),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  process(line);  // each line available asynchronously
}

// Async generator — produce values asynchronously
async function* paginate(url) {
  let cursor = null;
  do {
    const res = await fetch(url + (cursor ? `?cursor=${cursor}` : ""));
    const { data, nextCursor } = await res.json();
    yield* data;              // yield each item
    cursor = nextCursor;
  } while (cursor);
}

for await (const user of paginate("/api/users")) {
  await processUser(user);
}

// Convert Node.js stream to async iterable (Node.js 12+)
// Readable streams are async iterables natively
import { createReadStream } from "fs";
const stream = createReadStream("data.csv");

for await (const chunk of stream) {
  processChunk(chunk);
}

// AsyncIterator from events
import { on } from "events";
const emitter = new EventEmitter();

async function listen() {
  for await (const [data] of on(emitter, "data")) {
    console.log(data);
  }
}

// Stream.Readable.from — create readable stream from async generator
import { Readable } from "stream";
const readable = Readable.from(paginate("/api/users"));
```

---

# SECTION 3 · FILE SYSTEM & STREAMS

> `[MID]` fs/promises, Readable/Writable streams  
> `[SENIOR]` Transform streams, backpressure, stream pipelines, large file processing

---

## 3.1 File System

```js
import { readFile, writeFile, appendFile, copyFile,
         mkdir, rm, rename, stat, readdir,
         watch, open } from "fs/promises";
import { existsSync, createReadStream, createWriteStream } from "fs";
import path from "path";

// Reading files
const text  = await readFile("config.txt", "utf8");
const json  = JSON.parse(await readFile("config.json", "utf8"));
const bytes = await readFile("image.png");             // Buffer

// Writing files
await writeFile("output.txt", "content", "utf8");
await writeFile("output.json", JSON.stringify(data, null, 2));
await appendFile("log.txt", `${new Date().toISOString()} message\n`);

// File operations
await copyFile("src.txt", "dst.txt");
await rename("old.txt", "new.txt");                    // also moves files
await rm("file.txt");
await rm("directory", { recursive: true, force: true });

// Directories
await mkdir("new/nested/dir", { recursive: true });    // like mkdir -p
const entries = await readdir("./src", { withFileTypes: true });
entries.filter(e => e.isDirectory()).map(e => e.name); // subdirectory names

// File stats
const stats = await stat("file.txt");
stats.size           // bytes
stats.isFile()       // true/false
stats.isDirectory()  // true/false
stats.mtime          // Date of last modification
stats.atime          // Date of last access

// Check existence (avoid TOCTOU — check then act race condition)
// Preferred: try/catch instead of existsSync check
try {
  await readFile("config.json");
} catch (err) {
  if (err.code === "ENOENT") { /* file doesn't exist */ }
  else throw err;
}

// File handle — low-level control
const fh = await open("log.txt", "a");
try {
  await fh.appendFile("log entry\n");
  await fh.sync();           // flush to disk
} finally {
  await fh.close();
}

// Watch for changes
const watcher = watch("./config.json");
for await (const event of watcher) {
  console.log(event.eventType, event.filename);
  reloadConfig();
}

// Path manipulation
path.join("/users", "alice", "docs", "file.txt")     // /users/alice/docs/file.txt
path.resolve("../config/app.json")                    // absolute path
path.dirname("/users/alice/file.txt")                 // /users/alice
path.basename("/users/alice/file.txt")                // file.txt
path.extname("image.png")                             // .png
path.parse("/users/alice/file.txt")                   // { root, dir, base, ext, name }
```

---

## 3.2 Streams

```js
import { Readable, Writable, Transform, pipeline, finished } from "stream";
import { pipeline as pipelineAsync } from "stream/promises";  // Node 15+
import zlib from "zlib";

// Readable stream — data source
const readable = new Readable({
  objectMode: false,          // default: Buffer chunks
  highWaterMark: 64 * 1024,   // 64KB buffer size
  read(size) {
    // Called when consumer is ready for more data
    this.push(getNextChunk());  // push data
    this.push(null);            // signal end of stream
  }
});

// Writable stream — data destination
const writable = new Writable({
  highWaterMark: 64 * 1024,
  write(chunk, encoding, callback) {
    // Process chunk; call callback when done
    processData(chunk);
    callback();                 // no error; callback(err) to signal error
  },
  final(callback) {
    // Called before 'finish' event; flush remaining data
    flushBuffer();
    callback();
  }
});

// Transform stream — read + write + transform
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// Backpressure — critical for large data
// write() returns false when internal buffer is full
const writeable = fs.createWriteStream("output.txt");
writeable.on("drain", () => resume());  // resume when buffer drains

function writeWithBackpressure(readable, writable) {
  readable.on("data", (chunk) => {
    const ok = writable.write(chunk);
    if (!ok) readable.pause();          // pause reading when buffer full
  });
  writable.on("drain", () => readable.resume());  // resume when drained
  readable.on("end", () => writable.end());
}

// pipeline — handles backpressure, error propagation, cleanup automatically
// ALWAYS use pipeline instead of .pipe() — .pipe() doesn't forward errors
await pipelineAsync(
  fs.createReadStream("input.txt"),
  zlib.createGzip(),                    // compress
  upperCaseTransform,                   // transform
  fs.createWriteStream("output.txt.gz")
);

// Large file processing — stream instead of loading into memory
async function processLargeCSV(filePath) {
  await pipelineAsync(
    fs.createReadStream(filePath, { encoding: "utf8" }),
    splitLines(),            // custom transform: split on newline
    parseCSVRow(),           // custom transform: parse each line
    filterActiveRows(),      // custom transform: filter
    writeToDatabase(),       // custom writable: batch insert
  );
}

// Collect stream to buffer/string
async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function streamToString(readable) {
  const buf = await streamToBuffer(readable);
  return buf.toString("utf8");
}

// Object mode streams — pass JavaScript objects instead of Buffers
const objectStream = new Transform({
  objectMode: true,
  transform(record, _encoding, callback) {
    this.push({ ...record, processed: true });
    callback();
  }
});
```

---

# SECTION 4 · HTTP & NETWORKING

> `[JUNIOR]` http module basics, making requests  
> `[MID]` HTTPS, HTTP/2, WebSockets, DNS  
> `[SENIOR]` Connection pooling, keep-alive, HTTP/2 push, TCP internals

---

## 4.1 HTTP Server

```js
import { createServer } from "http";
import { createServer as createHttps } from "https";
import { readFileSync } from "fs";

// Basic HTTP server
const server = createServer((req, res) => {
  const { method, url, headers } = req;

  // Read body
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    const data = body ? JSON.parse(body) : null;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "ok", data }));
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server listening on port 3000");
});

// Server events
server.on("error",   (err) => console.error("Server error:", err));
server.on("close",   ()    => console.log("Server closed"));
server.on("request", (req, res) => {});  // same as createServer callback

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    // server.close stops accepting new connections; waits for existing to finish
    db.end();
    process.exit(0);
  });
  // Force shutdown after timeout
  setTimeout(() => process.exit(1), 30_000);
});

// HTTPS server
const httpsServer = createHttps({
  key:  readFileSync("key.pem"),
  cert: readFileSync("cert.pem"),
}, (req, res) => {
  res.end("Secure response");
});

// HTTP/2
import { createSecureServer } from "http2";
const h2Server = createSecureServer({
  key:  readFileSync("key.pem"),
  cert: readFileSync("cert.pem"),
});

h2Server.on("stream", (stream, headers) => {
  stream.respond({ ":status": 200, "content-type": "text/plain" });
  stream.end("Hello HTTP/2");
});
```

---

## 4.2 Making HTTP Requests

```js
// fetch — built-in since Node.js 18 (uses undici)
const res = await fetch("https://api.example.com/users", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  body: JSON.stringify({ name: "Alice" }),
  signal: AbortSignal.timeout(5000),  // timeout (Node 17.3+)
});

if (!res.ok) throw new Error(`HTTP ${res.status}`);
const user = await res.json();

// Streaming response body
const res = await fetch("https://example.com/large-file");
await pipelineAsync(
  Readable.fromWeb(res.body),
  fs.createWriteStream("download.bin")
);

// AbortController — cancel requests
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === "AbortError") console.log("Request timed out");
}

// axios — popular third-party HTTP client
import axios from "axios";

const client = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "Authorization": `Bearer ${token}` },
});

// Interceptors
client.interceptors.request.use(config => {
  config.headers["X-Request-ID"] = crypto.randomUUID();
  return config;
});

client.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await refreshToken();
      return client.request(err.config);  // retry with new token
    }
    return Promise.reject(err);
  }
);

const { data } = await client.get("/users");

// undici — low-level HTTP client (used by fetch internally)
import { request, Pool } from "undici";

// Connection pool — reuse connections for same origin
const pool = new Pool("https://api.example.com", { connections: 10 });
const { statusCode, body } = await pool.request({
  path: "/users",
  method: "GET",
  headers: { authorization: `Bearer ${token}` },
});
const data = await body.json();
```

---

# SECTION 5 · EXPRESS.JS

> `[JUNIOR]` Routing, middleware, request/response  
> `[MID]` Error handling, validation, authentication middleware  
> `[SENIOR]` Express internals, custom middleware, performance, alternatives

---

## 5.1 Express Fundamentals

```js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

const app = express();

// Built-in middleware
app.use(express.json({ limit: "10mb" }));                  // parse JSON body
app.use(express.urlencoded({ extended: true }));           // parse URL-encoded body
app.use(express.static("public"));                         // serve static files

// Third-party middleware
app.use(helmet());                                         // security headers
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") }));
app.use(morgan("combined"));                               // HTTP logging
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // rate limiting

// Routing
app.get("/",           (req, res) => res.send("Hello World"));
app.post("/users",     createUser);
app.put("/users/:id",  updateUser);
app.patch("/users/:id", patchUser);
app.delete("/users/:id", deleteUser);

// Request object
req.params.id             // route params: /users/:id
req.query.page            // query string: ?page=2
req.body                  // parsed body (requires middleware)
req.headers["x-api-key"]  // request headers
req.ip                    // client IP (with trust proxy set)
req.method                // GET, POST, etc.
req.path                  // /users/123
req.url                   // /users/123?sort=name
req.hostname              // example.com
req.protocol              // http or https
req.secure                // true if https
req.cookies               // with cookie-parser
req.get("Content-Type")   // header value

// Response object
res.status(201).json({ id: "123" });         // JSON response with status
res.send("plain text");                       // text response
res.sendFile(path.resolve("public/index.html"));
res.redirect(301, "https://new-url.com");
res.set("X-Custom-Header", "value");         // set header
res.cookie("session", token, { httpOnly: true, secure: true });
res.clearCookie("session");
res.download("file.pdf", "report.pdf");      // trigger download
res.end();                                   // no body

// Router — modularize routes
const userRouter = express.Router();
userRouter.use(authMiddleware);              // middleware for all user routes

userRouter.get("/",    listUsers);
userRouter.get("/:id", getUser);
userRouter.post("/",   createUser);

app.use("/api/users", userRouter);           // mount router

// Starting the server
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 5.2 Middleware

```js
// Middleware signature: (req, res, next)
// next() — call next middleware; next(err) — skip to error handler

// Application-level middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

// Authentication middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Authorization middleware factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

app.delete("/users/:id", requireAuth, requireRole("admin"), deleteUser);

// Async middleware — wrap to catch errors
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Or with express-async-errors (monkey-patches express)
import "express-async-errors";
// Now async route handlers propagate errors automatically

app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);  // throws on error
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
}));

// Error handling middleware — 4 parameters (err, req, res, next)
// MUST be registered AFTER all routes
app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.expose ? err.message : "Internal server error";

  if (status >= 500) {
    console.error("Unhandled error:", err);
  }

  res.status(status).json({
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    }
  });
});

// 404 handler — after all routes, before error handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});
```

---

## 5.3 Fastify (High-Performance Alternative)

```js
import Fastify from "fastify";
import { Type } from "@sinclair/typebox";  // JSON Schema types

const fastify = Fastify({
  logger: { level: "info" },
  trustProxy: true,
});

// Register plugins
await fastify.register(import("@fastify/cors"),    { origin: true });
await fastify.register(import("@fastify/helmet"));
await fastify.register(import("@fastify/jwt"),     { secret: process.env.JWT_SECRET });
await fastify.register(import("@fastify/rate-limit"), { max: 100, timeWindow: "1 minute" });

// Schema validation — built-in, powered by ajv (fast JSON schema validation)
const UserSchema = Type.Object({
  id:    Type.String({ format: "uuid" }),
  name:  Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: "email" }),
  age:   Type.Optional(Type.Integer({ minimum: 0, maximum: 150 })),
});

const CreateUserSchema = Type.Object({
  name:  Type.String({ minLength: 1 }),
  email: Type.String({ format: "email" }),
});

// Route with full schema
fastify.post("/users", {
  schema: {
    body: CreateUserSchema,
    response: {
      201: UserSchema,
      400: Type.Object({ error: Type.String() }),
    },
  },
  preHandler: [fastify.authenticate],  // auth hook
}, async (request, reply) => {
  const user = await userService.create(request.body);
  return reply.code(201).send(user);  // auto-serialized via schema
});

// Hooks — lifecycle hooks (different from Express middleware)
fastify.addHook("onRequest",    async (request, reply) => { /* before routing */ });
fastify.addHook("preHandler",   async (request, reply) => { /* before handler */ });
fastify.addHook("onSend",       async (request, reply, payload) => payload);
fastify.addHook("onResponse",   async (request, reply) => { /* after response */ });
fastify.addHook("onError",      async (request, reply, error) => { /* on error */ });

// Decorate — extend request/reply/fastify objects
fastify.decorate("config", { dbUrl: process.env.DATABASE_URL });
fastify.decorateRequest("user", null);
fastify.decorateReply("sendSuccess", function(data) {
  this.send({ success: true, data });
});

// Plugin system — encapsulated scope
async function usersPlugin(fastify, options) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/",    listUsers);
  fastify.get("/:id", getUser);
  fastify.post("/",   createUser);
}
fastify.register(usersPlugin, { prefix: "/api/users" });

await fastify.listen({ port: 3000, host: "0.0.0.0" });

// Fastify vs Express:
// Fastify: 2-3x faster (JSON schema serialization, compiled validators)
// Fastify: built-in TypeScript support, schema validation, structured logging
// Express: larger ecosystem, more middleware, simpler mental model
// Fastify: better for new projects; Express: better for existing/legacy projects
```

---

# SECTION 6 · DATABASES

> `[MID]` PostgreSQL (pg), MongoDB (Mongoose), connection pooling  
> `[SENIOR]` Query optimization, transactions, ORM trade-offs, migrations

---

## 6.1 PostgreSQL with pg / Postgres.js

```js
// node-postgres (pg) — mature, widely used
import pg from "pg";

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT ?? "5432"),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  max:      20,              // max pool size
  min:       2,              // min pool size
  idleTimeoutMillis: 30_000, // close idle connections after 30s
  connectionTimeoutMillis: 2_000, // fail fast if no connection available
});

// Query — always parameterized (prevent SQL injection)
const { rows } = await pool.query(
  "SELECT * FROM users WHERE id = $1 AND active = $2",
  [userId, true]
);

// Named queries — reusable prepared statements
await pool.query({
  name: "get-user-by-id",
  text: "SELECT * FROM users WHERE id = $1",
  values: [userId],
});

// Transactions
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
    [amount, fromId]
  );
  await client.query(
    "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
    [amount, toId]
  );
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();  // ALWAYS release client back to pool
}

// postgres.js — modern, ergonomic alternative
import postgres from "postgres";

const sql = postgres({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 20,
  transform: { column: postgres.camel },  // snake_case → camelCase
});

// Tagged template literals — automatically parameterized
const users = await sql`SELECT * FROM users WHERE active = ${true}`;
const user  = await sql`
  UPDATE users SET name = ${name}, updated_at = NOW()
  WHERE id = ${id}
  RETURNING *
`;

// Dynamic queries
const whereClause = sql`WHERE id = ${id}`;
const result = await sql`SELECT * FROM users ${whereClause}`;

// Transactions
await sql.begin(async sql => {
  await sql`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${fromId}`;
  await sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${toId}`;
  // auto-commit or rollback on throw
});
```

---

## 6.2 Prisma ORM

```js
// prisma/schema.prisma
/*
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  profile   Profile?

  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
}

enum Role { USER ADMIN MODERATOR }
*/

import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// CRUD operations
const user = await prisma.user.create({
  data: { name: "Alice", email: "alice@example.com" },
  select: { id: true, name: true, email: true },  // select specific fields
});

const users = await prisma.user.findMany({
  where: {
    role: "ADMIN",
    createdAt: { gte: new Date("2024-01-01") },
    OR: [{ name: { contains: "Alice" } }, { email: { endsWith: "@example.com" } }],
  },
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * pageSize,
  take: pageSize,
  include: { posts: { where: { published: true }, take: 5 } },  // eager load
});

const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: "Alice Updated" },
});

await prisma.user.delete({ where: { id: userId } });

// Transactions
const [debit, credit] = await prisma.$transaction([
  prisma.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } }),
  prisma.account.update({ where: { id: toId   }, data: { balance: { increment: amount } } }),
]);

// Interactive transaction (with dependencies between operations)
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: "new@example.com", name: "New" } });
  await tx.profile.create({ data: { userId: user.id, bio: "Hello" } });
});

// Raw SQL (escape hatch)
const result = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
await prisma.$executeRaw`UPDATE users SET active = false WHERE last_login < ${cutoff}`;
```

---

## 6.3 Redis

```js
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
  socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 3000) },
});

redis.on("error", err => console.error("Redis error:", err));
await redis.connect();

// Basic operations
await redis.set("key", "value");
await redis.set("key", "value", { EX: 3600, NX: true }); // TTL + only if not exists
const val = await redis.get("key");
await redis.del("key");
await redis.exists("key");  // 1 or 0
await redis.expire("key", 3600);  // set TTL on existing key
await redis.ttl("key");           // time to live in seconds

// Caching pattern
async function getWithCache(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setEx(key, ttl, JSON.stringify(data));
  return data;
}

const user = await getWithCache(
  `user:${userId}`,
  300,  // 5 minutes
  () => db.findUser(userId)
);

// Cache invalidation
await redis.del(`user:${userId}`);
// Pattern deletion (use sparingly — O(N) scan)
const keys = await redis.keys("user:*");
if (keys.length) await redis.del(keys);

// Data structures
await redis.hSet("user:123", { name: "Alice", email: "alice@example.com" });
await redis.hGet("user:123", "name");
await redis.hGetAll("user:123");

await redis.lPush("queue", JSON.stringify(job));  // push to front
await redis.rPop("queue");                         // pop from back (FIFO)
await redis.lLen("queue");                         // queue length

await redis.sAdd("online-users", userId);
await redis.sIsMember("online-users", userId);
await redis.sMembers("online-users");

await redis.zAdd("leaderboard", { score: 1500, value: userId });
await redis.zRangeWithScores("leaderboard", 0, 9, { REV: true });  // top 10

// Pub/Sub
const subscriber = redis.duplicate();
await subscriber.connect();
await subscriber.subscribe("notifications", (message) => {
  handleNotification(JSON.parse(message));
});
await redis.publish("notifications", JSON.stringify({ type: "email", to: "alice" }));

// Distributed lock (Redlock pattern)
const lockKey = `lock:resource:${resourceId}`;
const lockValue = crypto.randomUUID();
const acquired = await redis.set(lockKey, lockValue, { NX: true, PX: 30000 });
if (!acquired) throw new Error("Resource locked");
try {
  await doWork();
} finally {
  // Atomic unlock — only delete if our lock (Lua script)
  await redis.eval(
    `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
    { keys: [lockKey], arguments: [lockValue] }
  );
}
```

---

# SECTION 7 · AUTHENTICATION & SECURITY

> `[MID]` JWT, sessions, bcrypt, input validation  
> `[SENIOR]` OAuth2, OIDC, RBAC, security headers, OWASP Node.js

---

## 7.1 Authentication Patterns

```js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

// Password hashing
const SALT_ROUNDS = 12;  // ~300ms on modern hardware — slow is intentional

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);  // constant-time comparison
}

// JWT — stateless authentication
function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { sub: userId, role, type: "access" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m", issuer: "myapp", audience: "myapp-api" }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: "myapp",
    audience: "myapp-api",
  });
}

// Auth middleware
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    if (err instanceof jwt.JsonWebTokenError)
      return res.status(401).json({ error: "Invalid token" });
    next(err);
  }
}

// Refresh token rotation
async function refreshTokens(req, res) {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (payload.type !== "refresh") throw new Error("Not a refresh token");

    // Check token is in whitelist / not revoked
    const stored = await redis.get(`refresh:${payload.sub}`);
    if (stored !== refreshToken) return res.status(401).json({ error: "Refresh token reused" });

    const tokens = generateTokens(payload.sub, await getUserRole(payload.sub));

    // Rotate: invalidate old, store new
    await redis.setEx(`refresh:${payload.sub}`, 7 * 86400, tokens.refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true, secure: true, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}
```

---

## 7.2 Input Validation and Security

```js
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// Zod schema validation
const createUserSchema = z.object({
  name:     z.string().trim().min(1).max(100),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/,
            "Password must contain uppercase, lowercase, and number"),
  age:      z.number().int().min(13).max(120).optional(),
  role:     z.enum(["user", "admin"]).default("user"),
});

// Validation middleware factory
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }
    req[source] = result.data;  // replace with parsed/coerced data
    next();
  };
}

app.post("/users", validate(createUserSchema), createUser);

// Security headers (helmet defaults + custom)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// SQL injection — NEVER concatenate user input
// BAD:
const query = `SELECT * FROM users WHERE name = '${req.body.name}'`; // VULNERABLE

// GOOD: parameterized queries (pg, mysql2, postgres.js all support this)
const { rows } = await pool.query("SELECT * FROM users WHERE name = $1", [req.body.name]);

// XSS prevention — sanitize HTML content
const clean = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
  ALLOWED_ATTR: ["href"],
});

// Path traversal prevention
import path from "path";
function safeFilePath(baseDir, userInput) {
  const resolved = path.resolve(baseDir, userInput);
  if (!resolved.startsWith(path.resolve(baseDir) + path.sep)) {
    throw new Error("Path traversal attempt detected");
  }
  return resolved;
}

// CSRF — for cookie-based auth (not needed for Bearer token auth)
import csrf from "csurf";
app.use(csrf({ cookie: { httpOnly: true, sameSite: "strict" } }));
app.get("/csrf-token", (req, res) => res.json({ token: req.csrfToken() }));

// Rate limiting (express-rate-limit)
import rateLimit from "express-rate-limit";
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts per window
  message: { error: "Too many login attempts" },
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + req.body?.email,  // limit per IP+email
});
app.post("/auth/login", loginLimiter, login);
```

---

# SECTION 8 · WORKER THREADS & CHILD PROCESSES

> `[MID]` Child processes, worker threads basics  
> `[SENIOR]` Worker pools, SharedArrayBuffer, IPC, clustering

---

## 8.1 Worker Threads

```js
import { Worker, isMainThread, parentPort, workerData,
         WorkerOptions } from "worker_threads";

// Worker file: worker.js
if (!isMainThread) {
  const { input } = workerData;
  const result = heavyComputation(input);  // runs in separate thread
  parentPort.postMessage({ result });
  parentPort.on("message", msg => { /* handle messages from main */ });
}

// Main thread
function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", { workerData });
    worker.on("message",      resolve);
    worker.on("error",        reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}

const { result } = await runWorker({ input: largeDataset });

// SharedArrayBuffer — shared memory between threads
const shared = new SharedArrayBuffer(4);  // 4 bytes
const int32  = new Int32Array(shared);    // typed view into shared memory

// Atomics — thread-safe operations on SharedArrayBuffer
Atomics.add(int32, 0, 1);             // atomic increment
Atomics.compareExchange(int32, 0, expected, desired);  // CAS
Atomics.wait(int32, 0, expectedValue);  // block until value changes
Atomics.notify(int32, 0, 1);            // wake up 1 waiter

// Worker pool pattern — reuse workers
class WorkerPool {
  constructor(workerScript, numWorkers = os.cpus().length) {
    this.workers = Array.from({ length: numWorkers },
      () => ({ worker: new Worker(workerScript), idle: true })
    );
    this.queue = [];
  }

  run(data) {
    return new Promise((resolve, reject) => {
      const idle = this.workers.find(w => w.idle);
      if (idle) {
        this._runTask(idle, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  _runTask(entry, data, resolve, reject) {
    entry.idle = false;
    entry.worker.postMessage(data);
    entry.worker.once("message", (result) => {
      entry.idle = true;
      resolve(result);
      if (this.queue.length) {
        const { data, resolve, reject } = this.queue.shift();
        this._runTask(entry, data, resolve, reject);
      }
    });
    entry.worker.once("error", reject);
  }
}
```

---

## 8.2 Child Processes

```js
import { spawn, exec, execFile, fork } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// exec — runs command in shell; buffers output; good for small output
const { stdout, stderr } = await execAsync("ls -la /var/log");

// execFile — runs executable directly (no shell); safer for user input
const { stdout } = await promisify(execFile)("git", ["log", "--oneline", "-10"]);

// spawn — streams output; good for large output or long-running processes
const child = spawn("node", ["script.js", "--arg", value], {
  stdio: ["pipe", "pipe", "inherit"],  // pipe stdin/stdout, inherit stderr
  cwd: "/app",
  env: { ...process.env, NODE_ENV: "production" },
});

child.stdout.on("data", (data) => process.stdout.write(data));
await new Promise((resolve, reject) => {
  child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
  child.on("error", reject);
});

// fork — special spawn for Node.js modules; enables IPC channel
const child = fork("./worker-module.js", [], { silent: false });

// IPC messaging
child.send({ type: "task", data: { userId: 123 } });
child.on("message", (msg) => {
  if (msg.type === "result") handleResult(msg.data);
});

child.on("exit", (code, signal) => {
  console.log(`Child exited: code=${code} signal=${signal}`);
});

// Cluster — multi-process HTTP server
import cluster from "cluster";
import os from "os";

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} spawning ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died — restarting`);
    cluster.fork();  // restart crashed workers
  });

  // Zero-downtime reload: restart workers one by one
  function reload() {
    const workers = Object.values(cluster.workers);
    let i = 0;
    const next = () => {
      if (i >= workers.length) return;
      const worker = workers[i++];
      worker.on("exit", () => { cluster.fork().on("listening", next); });
      worker.send("shutdown");
    };
    next();
  }
} else {
  // Worker: run your server
  import("./server.js");
}
```

---

# SECTION 9 · TESTING

> `[MID]` Jest/Vitest, supertest, unit testing  
> `[SENIOR]` Integration tests, contract tests, test architecture, mocking strategies

---

## 9.1 Testing with Jest / Vitest

```js
// jest.config.js
export default {
  testEnvironment: "node",
  transform: { "^.+\\.ts$": ["@swc/jest"] },
  collectCoverageFrom: ["src/**/*.{js,ts}", "!src/**/*.d.ts"],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80 } },
};

// Unit testing — pure functions
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Service under test
describe("UserService", () => {
  let userService;
  let mockRepo;
  let mockEmailService;

  beforeEach(() => {
    mockRepo = {
      findById:  jest.fn(),
      findByEmail: jest.fn(),
      save:      jest.fn(),
      delete:    jest.fn(),
    };
    mockEmailService = { sendWelcome: jest.fn().mockResolvedValue(undefined) };
    userService = new UserService(mockRepo, mockEmailService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("findUser", () => {
    it("returns user when found", async () => {
      const user = { id: "1", name: "Alice" };
      mockRepo.findById.mockResolvedValue(user);

      const result = await userService.findUser("1");

      expect(result).toEqual(user);
      expect(mockRepo.findById).toHaveBeenCalledWith("1");
      expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    });

    it("throws UserNotFoundError when user missing", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(userService.findUser("999"))
        .rejects.toThrow(UserNotFoundError);
    });
  });

  describe("createUser", () => {
    it("hashes password before saving", async () => {
      const dto = { name: "Bob", email: "bob@test.com", password: "Secret1" };
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.save.mockImplementation(async user => ({ ...user, id: "new-id" }));

      await userService.createUser(dto);

      const savedUser = mockRepo.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe("Secret1");
      expect(savedUser.password).toMatch(/^\$2b\$/);  // bcrypt hash
    });

    it("throws if email already exists", async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: "existing" });
      await expect(userService.createUser({ email: "taken@test.com" }))
        .rejects.toThrow(ConflictError);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });
});

// Mocking modules
jest.mock("../lib/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "mock-id" }),
}));

jest.mock("../db", () => ({
  query: jest.fn(),
  transaction: jest.fn(async (fn) => fn({ query: jest.fn() })),
}));

// Timer mocks
jest.useFakeTimers();
const fn = jest.fn();
setTimeout(fn, 1000);
jest.advanceTimersByTime(1000);
expect(fn).toHaveBeenCalled();
jest.useRealTimers();
```

---

## 9.2 Integration Testing with Supertest

```js
import request from "supertest";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { redis } from "../src/redis.js";

// Test setup
beforeAll(async () => {
  await db.migrate.latest();  // run migrations on test DB
});

afterAll(async () => {
  await db.migrate.rollback();
  await db.destroy();
  await redis.quit();
});

beforeEach(async () => {
  await db("users").truncate();  // clean state per test
});

describe("POST /api/users", () => {
  it("creates user and returns 201", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Alice", email: "alice@test.com", password: "Secret1!" })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toMatchObject({
      id:    expect.any(String),
      name:  "Alice",
      email: "alice@test.com",
    });
    expect(res.body).not.toHaveProperty("password");  // never expose hash
  });

  it("returns 409 for duplicate email", async () => {
    await createUser({ email: "existing@test.com" });

    const res = await request(app)
      .post("/api/users")
      .send({ name: "Bob", email: "existing@test.com", password: "Secret1!" })
      .expect(409);

    expect(res.body.error).toMatch(/email.*already/i);
  });

  it("returns 422 for invalid input", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "", email: "not-an-email" })
      .expect(422);

    expect(res.body.details).toHaveProperty("email");
    expect(res.body.details).toHaveProperty("name");
  });
});

// Testing middleware
describe("Authentication middleware", () => {
  it("rejects requests without token", async () => {
    await request(app).get("/api/protected").expect(401);
  });

  it("rejects expired tokens", async () => {
    const expired = jwt.sign({ sub: "1" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${expired}`)
      .expect(401);
    expect(res.body.code).toBe("TOKEN_EXPIRED");
  });
});

// MSW (Mock Service Worker) for external API mocking
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("https://external-api.com/users/:id", ({ params }) => {
    return HttpResponse.json({ id: params.id, name: "Mocked User" });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

---

# SECTION 10 · PERFORMANCE & MONITORING

> `[MID]` Profiling, caching strategies, connection pooling  
> `[SENIOR]` Flame graphs, memory leak detection, APM, load testing

---

## 10.1 Performance Patterns

```js
// ─── Caching ──────────────────────────────────────────────────────────────────

// In-memory cache (node-cache) — single process
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

async function getUserCached(id) {
  const cached = cache.get(`user:${id}`);
  if (cached) return cached;

  const user = await db.findUser(id);
  cache.set(`user:${id}`, user);
  return user;
}

// HTTP caching — conditional requests
app.get("/api/data", async (req, res) => {
  const data = await getData();
  const etag = computeETag(data);  // content hash

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();  // Not Modified — saves bandwidth
  }

  res.set("ETag", etag);
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(data);
});

// ─── Streaming responses ──────────────────────────────────────────────────────

// Stream large datasets instead of loading all into memory
app.get("/api/export", async (req, res) => {
  res.set("Content-Type", "application/json");
  res.set("Transfer-Encoding", "chunked");

  res.write("[");
  let first = true;
  const cursor = db.streamAllUsers();  // database cursor

  cursor.on("data", (user) => {
    if (!first) res.write(",");
    res.write(JSON.stringify(user));
    first = false;
  });

  cursor.on("end", () => { res.write("]"); res.end(); });
  cursor.on("error", (err) => { res.destroy(err); });
});

// ─── Profiling ────────────────────────────────────────────────────────────────

// Clinic.js — profiling suite
// clinic doctor -- node server.js     (flamegraph, detect I/O vs CPU)
// clinic flame  -- node server.js     (flamegraph of CPU usage)
// clinic bubbleprof -- node server.js (async bottleneck profiling)

// Built-in profiler
node --prof server.js                   // generate isolate-*.log
node --prof-process isolate-*.log       // process log into readable output

// Performance hooks — precise timing
import { performance, PerformanceObserver } from "perf_hooks";

performance.mark("start-db-query");
await db.query("...");
performance.mark("end-db-query");
performance.measure("db-query", "start-db-query", "end-db-query");

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach(entry => {
    console.log(entry.name, entry.duration.toFixed(2), "ms");
  });
});
obs.observe({ entryTypes: ["measure"] });

// Memory leak detection
const used = process.memoryUsage();
console.log({
  rss:       `${(used.rss       / 1024 / 1024).toFixed(1)} MB`,  // resident set size
  heapTotal: `${(used.heapTotal / 1024 / 1024).toFixed(1)} MB`,
  heapUsed:  `${(used.heapUsed  / 1024 / 1024).toFixed(1)} MB`,
  external:  `${(used.external  / 1024 / 1024).toFixed(1)} MB`,
});

// Take heap snapshots for analysis
import v8 from "v8";
const snapshot = v8.writeHeapSnapshot();  // writes to current directory
// Load in Chrome DevTools Memory tab

// ─── Load testing ─────────────────────────────────────────────────────────────
// autocannon: npx autocannon -c 100 -d 30 http://localhost:3000/api/users
// k6: k6 run --vus 100 --duration 30s script.js
// artillery: artillery run load-test.yml
```

---

## 10.2 Logging and Observability

```js
import pino from "pino";
import { trace, context, propagation } from "@opentelemetry/api";

// Pino — fastest Node.js logger
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization", "*.password", "*.token"],  // hide sensitive fields
  serializers: {
    req:  pino.stdSerializers.req,
    res:  pino.stdSerializers.res,
    err:  pino.stdSerializers.err,
  },
  transport: process.env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: { colorize: true },
  } : undefined,
});

// Child logger — inherit context
const requestLogger = logger.child({ requestId: req.id, userId: req.user?.id });
requestLogger.info({ method: req.method, path: req.path }, "Request received");

// Structured logging — always log context as object, message as string
logger.error({ err, userId, orderId }, "Order processing failed");
// NOT: logger.error(`Order ${orderId} failed for user ${userId}: ${err.message}`)

// Request ID propagation middleware
import { randomUUID } from "crypto";
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] ?? randomUUID();
  res.set("X-Request-ID", req.id);
  req.log = logger.child({ requestId: req.id });
  next();
});

// OpenTelemetry — distributed tracing
const tracer = trace.getTracer("my-service", "1.0.0");

async function processOrder(orderId) {
  return tracer.startActiveSpan("processOrder", async (span) => {
    try {
      span.setAttribute("order.id", orderId);
      const order = await fetchOrder(orderId);
      span.setAttribute("order.total", order.total);
      const result = await fulfillOrder(order);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  });
}

// Health check endpoint — for load balancers and orchestrators
app.get("/health", async (req, res) => {
  const checks = await Promise.allSettled([
    db.query("SELECT 1"),             // database connectivity
    redis.ping(),                     // cache connectivity
  ]);

  const healthy = checks.every(c => c.status === "fulfilled");
  const details = {
    database: checks[0].status === "fulfilled" ? "ok" : "down",
    cache:    checks[1].status === "fulfilled" ? "ok" : "down",
    uptime:   process.uptime(),
    memory:   process.memoryUsage().heapUsed,
  };

  res.status(healthy ? 200 : 503).json({ status: healthy ? "ok" : "degraded", details });
});
```

---

# SECTION 11 · MICROSERVICES & MESSAGE QUEUES

> `[SENIOR]` Service communication, event-driven architecture, queues, gRPC

---

## 11.1 Message Queues (BullMQ / RabbitMQ)

```js
// BullMQ — Redis-backed job queue
import { Queue, Worker, QueueEvents } from "bullmq";

const connection = { host: "localhost", port: 6379 };

// Producer — add jobs to queue
const emailQueue = new Queue("emails", { connection });

await emailQueue.add(
  "welcome-email",
  { to: "alice@example.com", name: "Alice" },
  {
    delay:    0,
    attempts: 3,                      // retry up to 3 times on failure
    backoff:  { type: "exponential", delay: 1000 },
    removeOnComplete: 100,            // keep last 100 completed jobs
    removeOnFail:     50,
  }
);

// Scheduled / recurring jobs
await emailQueue.add("digest", {}, {
  repeat: { cron: "0 9 * * 1-5" },   // 9am weekdays
});

// Consumer — process jobs
const emailWorker = new Worker(
  "emails",
  async (job) => {
    const { to, name } = job.data;
    await sendEmail({ to, subject: `Welcome ${name}!`, template: "welcome" });
    return { sent: true, timestamp: Date.now() };
  },
  {
    connection,
    concurrency: 10,                  // process 10 jobs simultaneously
    limiter: { max: 100, duration: 60_000 }, // rate limit: 100/min
  }
);

emailWorker.on("completed", (job, result) =>
  logger.info({ jobId: job.id, result }, "Job completed")
);
emailWorker.on("failed", (job, err) =>
  logger.error({ jobId: job.id, err }, "Job failed")
);

// RabbitMQ — amqplib
import amqplib from "amqplib";

const conn = await amqplib.connect(process.env.RABBITMQ_URL);
const channel = await conn.createChannel();

// Publisher
const EXCHANGE = "orders";
await channel.assertExchange(EXCHANGE, "topic", { durable: true });
channel.publish(
  EXCHANGE,
  "order.created",                    // routing key
  Buffer.from(JSON.stringify(order)),
  { persistent: true, contentType: "application/json" }
);

// Consumer
await channel.assertQueue("order-processor", { durable: true });
await channel.bindQueue("order-processor", EXCHANGE, "order.*");
await channel.prefetch(10);           // fair dispatch — max 10 unacked at a time

channel.consume("order-processor", async (msg) => {
  if (!msg) return;
  try {
    const order = JSON.parse(msg.content.toString());
    await processOrder(order);
    channel.ack(msg);                 // acknowledge — remove from queue
  } catch (err) {
    // nack: requeue=false → dead letter queue after maxRetries
    channel.nack(msg, false, false);
  }
});
```

---

## 11.2 gRPC

```js
// gRPC — efficient binary RPC using Protocol Buffers

// proto/users.proto
/*
syntax = "proto3";
package users;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
  rpc CreateUser (CreateUserRequest) returns (User);
}

message User { string id = 1; string name = 2; string email = 3; }
message GetUserRequest { string id = 1; }
message ListUsersRequest { int32 page = 1; int32 page_size = 2; }
message CreateUserRequest { string name = 1; string email = 2; }
*/

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const def = protoLoader.loadSync("proto/users.proto", {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const { users } = grpc.loadPackageDefinition(def);

// Server
const server = new grpc.Server();
server.addService(users.UserService.service, {
  GetUser: async (call, callback) => {
    try {
      const user = await userService.findById(call.request.id);
      if (!user) return callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
      callback(null, user);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  ListUsers: async (call) => {
    const users = await userService.list(call.request);
    users.forEach(user => call.write(user));
    call.end();  // streaming response
  },
});

server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) throw err;
  server.start();
});

// Client
const client = new users.UserService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

const user = await new Promise((resolve, reject) => {
  client.GetUser({ id: "123" }, (err, response) => {
    if (err) reject(err); else resolve(response);
  });
});
```

---

# SECTION 12 · DEPLOYMENT & PRODUCTION

> `[MID]` Environment configuration, Docker, PM2  
> `[SENIOR]` Kubernetes, CI/CD, zero-downtime deploys, secrets management

---

## 12.1 Environment Configuration

```js
// 12-factor app: config from environment variables
// NEVER hardcode secrets; NEVER commit .env to git

// dotenv — load .env file in development
import "dotenv/config";       // ES Module (import once at entry point)
// or: require("dotenv").config();

// .env (not committed)
// DATABASE_URL=postgres://user:pass@localhost:5432/mydb
// JWT_SECRET=super-secret-value
// PORT=3000

// Config module with validation (zod)
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV:      z.enum(["development", "test", "production"]).default("development"),
  PORT:          z.coerce.number().default(3000),
  DATABASE_URL:  z.string().url(),
  JWT_SECRET:    z.string().min(32),
  REDIS_URL:     z.string().url().default("redis://localhost:6379"),
  LOG_LEVEL:     z.enum(["fatal","error","warn","info","debug","trace"]).default("info"),
  CORS_ORIGINS:  z.string().transform(s => s.split(",")),
});

let config;
try {
  config = envSchema.parse(process.env);
} catch (err) {
  console.error("Invalid environment configuration:", err.flatten().fieldErrors);
  process.exit(1);
}

export default config;
```

---

## 12.2 Docker and PM2

```dockerfile
# Dockerfile — multi-stage build for Node.js
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
# Run as non-root user
RUN addgroup --system nodejs && adduser --system --ingroup nodejs nodeuser
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY --from=build /app/package.json ./package.json

USER nodeuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  app:
    build: .
    ports:  ["3000:3000"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:secret@db:5432/mydb
    depends_on:
      db:    { condition: service_healthy }
      redis: { condition: service_healthy }
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: mydb
    volumes: [postgres-data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

volumes:
  postgres-data:
```

```js
// ecosystem.config.js — PM2 process manager
export default {
  apps: [{
    name:          "api-server",
    script:        "dist/server.js",
    instances:     "max",             // one per CPU core
    exec_mode:     "cluster",         // Node cluster mode
    watch:         false,
    max_memory_restart: "500M",
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "/var/log/pm2/app-error.log",
    out_file:   "/var/log/pm2/app-out.log",
  }],
};
// pm2 start ecosystem.config.js --env production
// pm2 reload app-server  (zero-downtime reload)
// pm2 monit              (monitoring dashboard)
```

---

# SECTION 13 · TYPESCRIPT WITH NODE.JS

> `[MID]` tsconfig, type-safe express/fastify, declaration files  
> `[SENIOR]` Advanced types, module augmentation, strict mode, performance

---

## 13.1 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target":           "ES2022",
    "module":           "NodeNext",
    "moduleResolution": "NodeNext",
    "lib":              ["ES2022"],
    "outDir":           "./dist",
    "rootDir":          "./src",
    "strict":           true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride":       true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop":  true,
    "skipLibCheck":     true,
    "declaration":      true,
    "declarationMap":   true,
    "sourceMap":        true,
    "resolveJsonModule": true,
    "baseUrl":          ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

```ts
// Type-safe Express
import express, { Request, Response, NextFunction } from "express";

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: "admin" | "user" };
      requestId: string;
    }
  }
}

// Typed route handler
interface CreateUserBody { name: string; email: string; }
interface UserParams     { id: string; }
interface UserQuery      { include?: "orders" | "profile"; }

app.post<{}, User, CreateUserBody>(
  "/users",
  async (req: Request<{}, User, CreateUserBody>, res: Response<User>) => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  }
);

// Generic repository pattern
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

class UserRepository implements Repository<User, string> {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.query<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    return row ?? null;
  }

  async findAll(filter: Partial<User> = {}): Promise<User[]> {
    // build dynamic where clause
    return this.db.query<User>("SELECT * FROM users");
  }

  async save(user: User): Promise<User> {
    const [saved] = await this.db.query<User>(
      "INSERT INTO users (id, name, email) VALUES ($1, $2, $3) RETURNING *",
      [user.id, user.name, user.email]
    );
    return saved!;
  }

  async delete(id: string): Promise<void> {
    await this.db.query("DELETE FROM users WHERE id = $1", [id]);
  }
}

// Discriminated unions for results (Railway oriented programming)
type Result<T, E = Error> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

async function findUser(id: string): Promise<Result<User, UserNotFoundError | DatabaseError>> {
  try {
    const user = await userRepo.findById(id);
    if (!user) return { ok: false, error: new UserNotFoundError(id) };
    return { ok: true, value: user };
  } catch (err) {
    return { ok: false, error: new DatabaseError("Query failed", { cause: err }) };
  }
}

const result = await findUser("123");
if (!result.ok) {
  if (result.error instanceof UserNotFoundError) return res.status(404).json({ error: result.error.message });
  return res.status(500).json({ error: "Internal error" });
}
return res.json(result.value);
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Understands async/await and can explain why you need it
✓ Knows error-first callback convention
✓ Uses const/let correctly — never var
✓ Handles errors in async functions with try/catch
✓ Understands the difference between = and == vs ===
✓ Knows what package.json and node_modules are
✓ Can write a basic Express server with routes
✓ Knows how to use environment variables
✓ Uses parameterized queries — not string concatenation
✓ Understands that require() is synchronous

RED FLAGS (Junior):
✗ Ignores err parameter in callbacks: (err, data) => { doSomething(data) }
✗ Uses var; doesn't understand hoisting
✗ Puts logic directly in index.js — no separation of concerns
✗ Commits .env or credentials to git
✗ Uses synchronous fs.readFileSync in request handlers
✗ Does not handle promise rejections (.catch or try/catch)
✗ Concatenates user input into SQL strings
✗ npm installs with --save-dev everything or blindly
✗ Blocking the event loop with heavy CPU synchronous work
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Explains event loop phases: timers, poll, check; knows nextTick vs setImmediate
✓ Designs middleware chains — knows order matters
✓ Implements graceful shutdown (SIGTERM handler + server.close())
✓ Uses streams for large data — doesn't buffer entire files in memory
✓ Understands connection pooling — doesn't create new DB connections per request
✓ Writes integration tests with supertest; mocks external services
✓ Knows how to profile Node.js (clinic.js, --prof)
✓ Implements proper JWT — short-lived access tokens + refresh rotation
✓ Understands Promise.allSettled vs Promise.all trade-offs
✓ Uses worker_threads for CPU-bound tasks
✓ Knows difference between unhandledRejection and uncaughtException

RED FLAGS (Mid):
✗ Creates DB connections inside route handlers
✗ Logs sensitive data (passwords, tokens, PII) 
✗ Doesn't set Content-Type or uses res.send() for JSON (instead of res.json())
✗ Swallows errors: catch(err) {} or catch(err) { console.log(err) } (not throw)
✗ No input validation on routes
✗ Uses synchronous crypto operations for password hashing in request handlers
✗ Doesn't handle ECONNRESET, ETIMEDOUT, ECONNREFUSED in external requests
✗ Returns stack traces to clients in production
✗ Doesn't understand what CORS actually protects against
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Can draw and explain the event loop — libuv, phases, microtask queue
✓ Designs backpressure correctly in stream pipelines
✓ Uses cluster or worker_threads appropriately — knows the difference
✓ Designs circuit breakers and bulkheads for external service calls
✓ Implements distributed tracing (OpenTelemetry, correlation IDs)
✓ Understands Node.js memory model — V8 heap, old/new space, GC pressure
✓ Knows when to use Redis pub/sub vs message queue (BullMQ/RabbitMQ)
✓ Implements proper token refresh rotation with refresh token family tracking
✓ Designs idempotent APIs and at-least-once delivery patterns
✓ Knows V8 optimization killers (arguments object, try/catch in hot path, etc.)
✓ Understands SSRF, injection, deserialization vulnerabilities at implementation level
✓ Implements zero-downtime deploys — rolling updates, connection draining
✓ Writes performance benchmarks — knows autocannon, k6, flame graph interpretation

RED FLAGS (Senior):
✗ Recommends clustering for I/O-bound work (vs worker threads for CPU)
✗ Uses setTimeout(fn, 0) as a deliberate yield — doesn't know setImmediate
✗ Can't explain why a Promise chain is leaking memory
✗ Uses synchronous locks (not possible in Node.js main thread — red flag if claimed)
✗ Doesn't know about SSRF when building proxy or webhook features
✗ Cannot explain why process.nextTick can starve the event loop
✗ No strategy for handling partial failures in microservice calls
✗ Designs systems where a single Redis failure takes down the entire app
✗ Can't explain what a flame graph shows or how to read it
✗ No knowledge of structured logging vs log aggregation vs tracing — treats them the same
```

---

# APPENDIX B — NODE.JS VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **Node 12** | ES Modules (experimental), V8 7.4, optional chaining/nullish coalescing (via v8), AsyncLocalStorage experimental |
| **Node 14** | ES Modules (unflagged), optional chaining `?.`, nullish coalescing `??`, WeakRefs, `fs.promises` API, AsyncLocalStorage stable (LTS) |
| **Node 16** | `AbortController` stable, `fs/promises` stable, V8 9.4, `crypto.webcrypto` stable, npm 7, `Error.cause` (LTS) |
| **Node 18** | **`fetch` built-in** (undici), `FormData`/`Blob`/`Response` globals, V8 10.2, `node:test` built-in test runner, `readline/promises`, Undici, Web Streams API (LTS) |
| **Node 20** | `Permission Model` (experimental), `--env-file` flag, stable `node:test` runner with mocking, `URL.canParse()`, V8 11.3, globs in `import` (LTS) |
| **Node 22** | `require()` for ESM (experimental), `import.meta.filename/dirname`, `WebSocket` client built-in, `node:sqlite` built-in, Maglev compiler in V8 (LTS 2024) |

---

# APPENDIX C — BUILT-IN MODULES QUICK REFERENCE

| Module | Purpose | Key APIs |
|--------|---------|----------|
| `fs/promises` | File system | `readFile`, `writeFile`, `readdir`, `stat`, `mkdir`, `rm`, `watch` |
| `path` | Path manipulation | `join`, `resolve`, `dirname`, `basename`, `extname`, `parse` |
| `os` | Operating system | `cpus()`, `totalmem()`, `freemem()`, `tmpdir()`, `homedir()`, `platform()` |
| `crypto` | Cryptography | `randomUUID()`, `createHash`, `createHmac`, `pbkdf2`, `scrypt`, `timingSafeEqual` |
| `http`/`https` | HTTP server/client | `createServer`, `request` |
| `stream` | Streams | `Readable`, `Writable`, `Transform`, `pipeline`, `finished` |
| `events` | EventEmitter | `EventEmitter`, `once`, `on` (async iter) |
| `worker_threads` | CPU parallelism | `Worker`, `workerData`, `parentPort`, `SharedArrayBuffer` |
| `child_process` | Process spawning | `spawn`, `fork`, `exec`, `execFile` |
| `cluster` | Process clustering | `isPrimary`, `fork`, `workers` |
| `net` | TCP sockets | `createServer`, `createConnection` |
| `url` | URL parsing | `URL`, `URLSearchParams`, `fileURLToPath` |
| `util` | Utilities | `promisify`, `inspect`, `format`, `types`, `callbackify` |
| `buffer` | Binary data | `Buffer.from`, `Buffer.alloc`, `Buffer.concat` |
| `zlib` | Compression | `createGzip`, `createGunzip`, `createBrotliCompress` |
| `perf_hooks` | Performance | `performance`, `PerformanceObserver`, `monitorEventLoopDelay` |
| `diagnostics_channel` | Pub/Sub for diagnostics | `channel`, `subscribe`, `publish` |
| `async_hooks` | Async context tracking | `AsyncLocalStorage`, `AsyncResource` |
| `node:test` | Built-in test runner | `test`, `describe`, `it`, `mock`, `assert` |
| `node:sqlite` | SQLite (Node 22+) | `DatabaseSync`, `open`, `prepare` |

---

# APPENDIX D — SECURITY CHECKLIST

```
AUTHENTICATION:
□ Passwords hashed with bcrypt/argon2 (cost ≥ 12) — never MD5/SHA1/SHA256
□ JWT: short-lived access tokens (15min), rotating refresh tokens
□ Refresh tokens stored as HttpOnly, Secure, SameSite=Strict cookies
□ Token revocation strategy (blocklist or refresh token family)
□ Brute-force protection on login (rate limiting per IP+email)

INPUT VALIDATION:
□ All user input validated (zod/joi/yup) before use
□ SQL queries use parameterized statements — zero string concatenation
□ File paths checked against base directory (path traversal prevention)
□ HTML content sanitized before storage/display (XSS prevention)
□ File upload: validate type (magic bytes), size limit, safe storage location
□ JSON body size limited (express.json({ limit: "1mb" }))

HTTP SECURITY:
□ Helmet middleware (security headers: CSP, HSTS, nosniff, etc.)
□ CORS: explicit origin whitelist — never Access-Control-Allow-Origin: *
□ Rate limiting on all public endpoints
□ Request size limits configured

DEPENDENCIES:
□ npm audit run in CI — fails build on high/critical
□ Dependencies pinned with package-lock.json committed
□ Dependabot or Renovate for automated updates
□ Only production dependencies in final image

SECRETS:
□ No secrets in source code or logs
□ .env in .gitignore; secrets in vault (AWS Secrets Manager, HashiCorp Vault)
□ Sensitive fields redacted in logs (pino redact)
□ No PII in error messages returned to client

RUNTIME:
□ Running as non-root user in Docker
□ Read-only filesystem where possible
□ SIGTERM handler for graceful shutdown
□ process.on("uncaughtException") logs and exits (not silently swallows)
□ Errors do not expose stack traces to clients in production
```

---

# APPENDIX E — COMMON PATTERNS AND RECIPES

```js
// Graceful shutdown — complete pattern
class GracefulShutdown {
  constructor(server, { timeout = 30_000 } = {}) {
    this.server   = server;
    this.timeout  = timeout;
    this.isShuttingDown = false;

    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    process.on("SIGINT",  () => this.shutdown("SIGINT"));
  }

  async shutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    logger.info({ signal }, "Shutdown initiated");

    const forceExit = setTimeout(() => {
      logger.error("Graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, this.timeout);

    try {
      await new Promise((res, rej) => this.server.close(err => err ? rej(err) : res()));
      await db.end();
      await redis.quit();
      logger.info("Graceful shutdown complete");
      clearTimeout(forceExit);
      process.exit(0);
    } catch (err) {
      logger.error(err, "Error during shutdown");
      process.exit(1);
    }
  }
}

// AsyncLocalStorage — request context propagation without prop drilling
import { AsyncLocalStorage } from "async_hooks";

const requestContext = new AsyncLocalStorage();

// Middleware: set context
app.use((req, res, next) => {
  requestContext.run({ requestId: req.id, userId: req.user?.id }, next);
});

// Anywhere in the call stack — no need to pass context
function anyDeepFunction() {
  const ctx = requestContext.getStore();
  logger.info({ requestId: ctx?.requestId }, "Doing work");
}

// Circuit breaker pattern
class CircuitBreaker {
  constructor(fn, { threshold = 5, timeout = 60_000 } = {}) {
    this.fn = fn;
    this.threshold = threshold;
    this.timeout   = timeout;
    this.failures  = 0;
    this.state     = "CLOSED";  // CLOSED | OPEN | HALF_OPEN
    this.nextAttempt = 0;
  }

  async call(...args) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) throw new Error("Circuit open");
      this.state = "HALF_OPEN";
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() { this.failures = 0; this.state = "CLOSED"; }
  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Event Emitter with TypeScript types
import { EventEmitter } from "events";

interface OrderEvents {
  created:   [order: Order];
  confirmed: [orderId: string, confirmedAt: Date];
  cancelled: [orderId: string, reason: string];
}

class OrderEventEmitter extends EventEmitter {
  emit<K extends keyof OrderEvents>(event: K, ...args: OrderEvents[K]): boolean {
    return super.emit(event, ...args);
  }
  on<K extends keyof OrderEvents>(event: K, listener: (...args: OrderEvents[K]) => void): this {
    return super.on(event, listener);
  }
  once<K extends keyof OrderEvents>(event: K, listener: (...args: OrderEvents[K]) => void): this {
    return super.once(event, listener);
  }
}
```

---

# APPENDIX F — EVENT LOOP EXECUTION ORDER CHEAT SHEET

```js
// Complete execution order example
console.log("1");              // sync

process.nextTick(() => console.log("3"));    // nextTick queue

Promise.resolve()
  .then(() => console.log("4"))              // microtask queue
  .then(() => console.log("5"));             // microtask queue

queueMicrotask(() => console.log("6"));      // microtask queue

setImmediate(() => console.log("8"));        // check phase

setTimeout(() => console.log("7"), 0);       // timers phase (non-deterministic vs setImmediate)

console.log("2");              // sync

// Output:
// 1 (sync)
// 2 (sync)
// 3 (nextTick — before microtasks)
// 4 (Promise microtask)
// 5 (Promise microtask — chained, queued after 4 resolved)
// 6 (queueMicrotask)
// 7 or 8 (setTimeout/setImmediate race — 7 usually first outside I/O)

// ─── Priority order (highest to lowest): ─────────────────────────────────────
// 1. Synchronous code
// 2. process.nextTick() ← drains completely between each event loop phase
// 3. Promise microtasks ← drains completely after nextTick queue
// 4. queueMicrotask()   ← same queue as Promise microtasks
// 5. setTimeout(fn, 0) / setInterval — timers phase
// 6. I/O callbacks — poll phase  
// 7. setImmediate — check phase (always after I/O, before next timer cycle)
// 8. close callbacks (socket.on("close"))

// ─── Key rules: ──────────────────────────────────────────────────────────────
// nextTick can starve event loop if called recursively — avoid in hot paths
// setImmediate ALWAYS runs after I/O before setTimeout in same iteration
// Promise.resolve() does NOT mean synchronous — it's still async (microtask)
// await is equivalent to .then() — code after await is a microtask
```

---

*END OF NODE.JS RAG KNOWLEDGE BASE DOCUMENT*