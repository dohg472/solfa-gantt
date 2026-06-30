export function onRequest() {
  return Response.json({ ok: true, runtime: "cloudflare-pages" }, { headers: noStoreHeaders() });
}

function noStoreHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  };
}
