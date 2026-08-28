import { redirect } from "next/navigation";

/**
 * /vpn — permanent redirect to the landing.
 *
 * The old marketing page here used the word "VPN" in the URL, body,
 * and terminal mockups. The site is now positioned as "ускоритель
 * интернета" (RU legal compliance), so the URL and every reference
 * to it were removed from navigation. Keep the route so any old
 * external link still resolves — it just lands the visitor on the
 * homepage.
 */
export default function VpnRedirect(): never {
  redirect("/");
}
