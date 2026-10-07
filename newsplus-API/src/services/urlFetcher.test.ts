import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { fetchPublicText } from "./urlFetcher.js";
import { ValidationError } from "../utils/errors.js";
import dns from "node:dns/promises";
import http from "node:http";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

const SOURCE_URL = "https://93.184.216.34/report";
const SOURCE = "The authority has not yet approved the proposed plan. The spokesperson said it would be reviewed once the study is complete.";

test("a hostname cannot rebind to a private address between validation and connection", async () => {
  const connected: string[] = [];
  let resolutions = 0;
  const dnsMock = mock.method(dns, "lookup", async () => [{ address: ++resolutions === 1 ? "93.184.216.34" : "127.0.0.1", family: 4 }]);
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    const records = await dns.lookup("rebind.example", { all: true });
    connected.push(records[0]!.address);
    return new Response(`<article>${SOURCE}</article>`);
  });
  const requestMock = mock.method(http, "request", (_url: unknown, options: http.RequestOptions, onResponse: (response: http.IncomingMessage) => void) => {
    const request = new EventEmitter() as http.ClientRequest;
    request.end = (() => {
      options.lookup!("rebind.example", { all: true }, (error, records) => {
        if (error) { request.emit("error", error); return; }
        if (Array.isArray(records)) connected.push(records[0]!.address);
        const incoming = Readable.from([Buffer.from(`<article>${SOURCE}</article>`)]) as unknown as http.IncomingMessage;
        incoming.statusCode = 200;
        incoming.headers = { "content-type": "text/html" };
        onResponse(incoming);
      });
      return request;
    }) as http.ClientRequest["end"];
    return request;
  });
  try {
    assert.equal((await fetchPublicText("http://rebind.example/report")).text, SOURCE);
    assert.deepEqual(connected, ["93.184.216.34"]);
  } finally { requestMock.mock.restore(); fetchMock.mock.restore(); dnsMock.mock.restore(); }
});

test("redirects to private targets are rejected before fetching them", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (_url: string | URL | Request, options?: RequestInit) => {
    assert.equal(options?.redirect, "manual");
    return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } });
  });
  try {
    await assert.rejects(fetchPublicText(SOURCE_URL), (error: unknown) => error instanceof ValidationError && error.publicMessage === "url-blocked");
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally { fetchMock.mock.restore(); }
});

test("private IPv6 and mapped IPv4 addresses are blocked without network requests", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(SOURCE));
  try {
    for (const host of ["[::]", "[::1]", "[::ffff:127.0.0.1]", "[::ffff:192.168.1.1]", "[fe90::1]", "[fd00::1]"]) {
      await assert.rejects(fetchPublicText(`http://${host}/`), (error: unknown) => error instanceof ValidationError && error.publicMessage === "url-blocked");
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  } finally { fetchMock.mock.restore(); }
});

test("a valid relative redirect reaches the article", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request) => String(url).endsWith("/report")
    ? new Response(null, { status: 302, headers: { location: "/article" } })
    : new Response(`<article>${SOURCE}</article>`));
  try {
    assert.deepEqual(await fetchPublicText(SOURCE_URL), { url: "https://93.184.216.34/article", text: SOURCE });
  } finally { fetchMock.mock.restore(); }
});

test("article extraction excludes the longer page navigation and related stories", async () => {
  const noise = "Related story that has nothing to do with the source. ".repeat(40);
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(`<html><title>Source report</title><body><article>${SOURCE}</article><div>${noise}</div></body></html>`));
  try {
    const page = await fetchPublicText(SOURCE_URL);
    assert.ok(page.text.includes(SOURCE));
    assert.ok(!page.text.includes("Related story"));
  } finally { fetchMock.mock.restore(); }
});

test("plain text source retains comparison signs and paragraph boundaries", async () => {
  const source = `${SOURCE}\n\nThe comparison is 3 < 5 and 8 > 2.`;
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(source, { headers: { "content-type": "text/plain" } }));
  try { assert.equal((await fetchPublicText(SOURCE_URL)).text, source); }
  finally { fetchMock.mock.restore(); }
});

test("oversized response streams are cancelled before reading the entire body", async () => {
  let cancelled = false;
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(500_001).fill(120)); },
    cancel() { cancelled = true; },
  })));
  try {
    await assert.rejects(fetchPublicText(SOURCE_URL, { rejectTruncated: true }), (error: unknown) => error instanceof ValidationError && error.publicMessage === "source-too-long");
    assert.ok(cancelled);
  } finally { fetchMock.mock.restore(); }
});
