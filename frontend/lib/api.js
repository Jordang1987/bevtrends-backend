// lib/api.js
const base = (() => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  if (!raw) return "";
  try { return new URL(raw).origin; } catch { return raw.replace(/\/+$/, ""); }
})();

function buildUrl(path, params) {
  const u = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params || typeof params !== "object") return u;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    Array.isArray(v) ? v.forEach(x => q.append(k, String(x))) : q.set(k, String(v));
  }
  const qs = q.toString();
  return qs ? `${u}?${qs}` : u;
}

export async function wakeBackend({ timeout = 8000 } = {}) {
  if (!base) return;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try { await fetch(base + "/", { signal: ctrl.signal }); } catch {}
  clearTimeout(t);
}

let firstGetDone = false;

async function jsonFetch(method, url, {
  timeout = 12000,
  retries = 0,
  retryDelay = 1200,
  headers,
  body,
  wakeOnFail = true,
} = {}) {
  if (!base) throw new Error("EXPO_PUBLIC_API_URL not set");

  // give the **first** network call a long leash (cold start)
  const effectiveTimeout = firstGetDone ? timeout : Math.max(timeout, 60000);

  let didWake = false;

  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), effectiveTimeout);
    try {
      console.log("FETCH →", url);
      const res = await fetch(url, {
        method,
        headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(headers || {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const looksJson = /^\s*[\[{]|^\s*\{/.test(text);
      if (looksJson || ct.includes("application/json")) {
        try { const json = JSON.parse(text || "null"); firstGetDone = true; return json; }
        catch (e) { throw new Error(`Bad JSON: ${e.message}`); }
      }
      throw new Error(`Expected JSON. Got: ${text.slice(0, 160)}`);
    } catch (e) {
      const msg = String(e?.message || "");
      const isAbort = e?.name === "AbortError";
      const transient = isAbort || /network request failed|TypeError: Network/i.test(msg);

      if (transient && wakeOnFail && !didWake) {
        didWake = true;
        try { await wakeBackend({ timeout: 8000 }); } catch {}
      }

      if (attempt < retries && transient) {
        const delay = retryDelay * (attempt + 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(to);
    }
  }
}

export async function apiGet(path, opts = {}) {
  const { params, ...rest } = opts;
  const url = buildUrl(path, params);
  return jsonFetch("GET", url, rest);
}

export async function apiPost(path, body, opts = {}) {
  const url = buildUrl(path, opts.params);
  return jsonFetch("POST", url, { ...opts, body });
}
