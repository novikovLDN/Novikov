/**
 * Normalize an email for anti-fraud trial blocklist lookups.
 *
 * - lowercase everything
 * - for gmail.com / googlemail.com: drop dots from the local-part, drop "+suffix"
 *
 * "Foo.Bar+spam@Gmail.com" → "foobar@gmail.com"
 * "User@example.com"       → "user@example.com"
 *
 * The result is for comparison/storage only — never use it as a sending address.
 */
export function normalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at <= 0) return lower;
  const local = lower.slice(0, at);
  const domain = lower.slice(at + 1);

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const stripped = local.split("+")[0].replace(/\./g, "");
    return `${stripped}@gmail.com`;
  }

  return `${local}@${domain}`;
}
