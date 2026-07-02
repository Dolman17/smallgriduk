export async function onRequestPost(context) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };

  try {
    const kv = context.env.SEARCH_LOGS;

    if (!kv) {
      return new Response(
        JSON.stringify({ ok: false, error: "SEARCH_LOGS KV binding is not configured" }),
        { status: 503, headers }
      );
    }

    const body = await context.request.json().catch(() => null);
    const rawQuery = typeof body?.query === "string" ? body.query : "";
    const rawPath = typeof body?.path === "string" ? body.path : "/search/";

    const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 120);
    const path = rawPath.trim().slice(0, 200);

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers });
    }

    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const safeQueryKey = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "query";
    const id = crypto.randomUUID();

    const record = {
      query,
      path,
      day,
      timestamp: now.toISOString(),
    };

    await kv.put(`search:${day}:${safeQueryKey}:${id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 180,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }
}
