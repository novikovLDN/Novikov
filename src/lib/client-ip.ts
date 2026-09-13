/**
 * Client IP for rate limits, trial anti-abuse and audit.
 *
 * The site sits behind Cloudflare → Railway. Cloudflare overwrites
 * `cf-connecting-ip` with the address that connected to it, so that
 * header cannot be forged through Cloudflare. `x-forwarded-for` CAN be
 * forged: its first entry is whatever the client sent. It remains the
 * fallback (same behaviour as before) for requests that do not come
 * through Cloudflare — local runs and the bare *.up.railway.app host.
 *
 * Only syntactically valid addresses are returned; anything else → null,
 * so a junk header cannot mint an endless supply of rate-limit buckets.
 */

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:.]{2,45}$/i;

export function isValidIp(v: string): boolean {
  return IPV4.test(v) || (v.includes(":") && IPV6.test(v));
}

type HeaderSource = { get(name: string): string | null };

export function clientIpFrom(headers: HeaderSource): string | null {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf && isValidIp(cf)) return cf;
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff && isValidIp(xff)) return xff;
  const real = headers.get("x-real-ip")?.trim();
  if (real && isValidIp(real)) return real;
  return null;
}

/** Same, with a stable placeholder for rate-limit keys. */
export function clientIpKey(headers: HeaderSource): string {
  return clientIpFrom(headers) ?? "unknown";
}
