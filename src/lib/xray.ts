/**
 * Xray VPN Server Integration
 *
 * This module provides the structure for managing users on an Xray (V2Ray) server.
 * It handles UUID generation, user provisioning, and key management.
 *
 * Supported protocols: VLESS, VMess, Trojan
 *
 * Integration points:
 * 1. Xray API (gRPC) — for adding/removing users in real-time
 * 2. Xray config.json — for persistent user storage
 * 3. Panel API (e.g., 3x-ui, Marzban) — optional web panel integration
 */

import { v4 as uuidv4 } from "uuid";

// ─── Configuration ───────────────────────────────────────────────

export interface XrayConfig {
  /** Xray API endpoint (gRPC) — e.g., "127.0.0.1:10085" */
  apiHost: string;
  /** Panel API URL — e.g., "https://panel.example.com/api" */
  panelUrl: string | null;
  /** Panel API token */
  panelToken: string | null;
  /** Server domain for connection strings */
  serverDomain: string;
  /** Server port */
  serverPort: number;
  /** Default protocol */
  defaultProtocol: "vless" | "vmess" | "trojan";
  /** VLESS flow type (e.g., "xtls-rprx-vision") */
  flow: string;
  /** Network type (e.g., "tcp", "ws", "grpc") */
  network: string;
  /** Security type (e.g., "reality", "tls", "none") */
  security: string;
  /** SNI for TLS/Reality */
  sni: string;
  /** Fingerprint for Reality */
  fingerprint: string;
  /** Public key for Reality */
  publicKey: string;
  /** Short ID for Reality */
  shortId: string;
}

const defaultConfig: XrayConfig = {
  apiHost: process.env.XRAY_API_HOST || "127.0.0.1:10085",
  panelUrl: process.env.XRAY_PANEL_URL || null,
  panelToken: process.env.XRAY_PANEL_TOKEN || null,
  serverDomain: process.env.XRAY_SERVER_DOMAIN || "159.195.20.201",
  serverPort: parseInt(process.env.XRAY_SERVER_PORT || "4443"),
  defaultProtocol: (process.env.XRAY_PROTOCOL as "vless" | "vmess" | "trojan") || "vless",
  flow: process.env.XRAY_FLOW || "xtls-rprx-vision",
  network: process.env.XRAY_NETWORK || "tcp",
  security: process.env.XRAY_SECURITY || "reality",
  sni: process.env.XRAY_SNI || "myvpncloud.net",
  fingerprint: process.env.XRAY_FINGERPRINT || "chrome",
  publicKey: process.env.XRAY_PUBLIC_KEY || "4km41B5xZ3iJ4Z_VJ9WazIg3s_Pf2qSDmm55Yf28akg",
  shortId: process.env.XRAY_SHORT_ID || "a1b2c3d4",
};

// ─── Server Pool (all available servers) ─────────────────────────

export interface ServerEntry {
  name: string;
  ip: string;
  port: number;
  sni: string;
  fingerprint: string;
  publicKey: string;
  shortId: string;
  flow: string;
  network: string;
  security: string;
}

export const SERVER_POOL: ServerEntry[] = [
  {
    name: "🇳🇱 Atlas Fast #1",
    ip: "159.195.20.201",
    port: 4443,
    sni: "myvpncloud.net",
    fingerprint: "chrome",
    publicKey: "4km41B5xZ3iJ4Z_VJ9WazIg3s_Pf2qSDmm55Yf28akg",
    shortId: "a1b2c3d4",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
  {
    name: "🇩🇪 Atlas Fast #2 ⚡️",
    ip: "45.144.55.159",
    port: 4443,
    sni: "flowgrocery.com",
    fingerprint: "chrome",
    publicKey: "5b38RSRtlEw-HMYj1PmvS0QL8mZco2Bj_58sw2wikjA",
    shortId: "a1b2c3d4",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
  {
    name: "🇷🇺 LTE-5G ОБХОД | Все операторы ⚡️",
    ip: "185.241.193.94",
    port: 443,
    sni: "eh.vk.com",
    fingerprint: "chrome",
    publicKey: "AD3iu5zxfDZWeMEHSWTH5JuiokSv3ohQEg1Y_aUxzgA",
    shortId: "a1b2c3d4",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
  {
    name: "🇷🇺 LTE-5G ОБХОД | Все + Мегафон ⚡️",
    ip: "185.241.193.94",
    port: 443,
    sni: "max.ru",
    fingerprint: "firefox",
    publicKey: "CrQHeDnhvv7Cqdbrx19mmbmTLN02uqIrmVzyufVUz0s",
    shortId: "1a2b3c4d",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
  {
    name: "🇪🇺 LTE-5G ОБХОД + ВПН ⚡️",
    ip: "185.241.193.94",
    port: 8444,
    sni: "eh.vk.com",
    fingerprint: "chrome",
    publicKey: "AD3iu5zxfDZWeMEHSWTH5JuiokSv3ohQEg1Y_aUxzgA",
    shortId: "a1b2c3d4",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
  {
    name: "🇪🇺 LTE-5G ОБХОД + ВПН Мегафон ⚡️",
    ip: "185.241.193.94",
    port: 8443,
    sni: "max.ru",
    fingerprint: "firefox",
    publicKey: "7uELniOcmygn2k9ywnZsJ0QzCsli_1e0bFGpqHcF4RY",
    shortId: "1a2b3c4d",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
];

/** Build VLESS URIs for all servers in the pool */
export function buildAllServerUris(uuid: string): string[] {
  return SERVER_POOL.map((server) => {
    const params = new URLSearchParams({
      type: server.network,
      security: server.security,
      flow: server.flow,
      fp: server.fingerprint,
      sni: server.sni,
      pbk: server.publicKey,
      sid: server.shortId,
    });
    return `vless://${uuid}@${server.ip}:${server.port}?${params.toString()}#${encodeURIComponent(server.name)}`;
  });
}

// ─── Subscription URL ────────────────────────────────────────────

const SUB_BASE_URL = process.env.SUB_BASE_URL || "https://qodev.dev/api/sub";

/** Build subscription URL for a user */
export function buildSubscriptionUrl(subToken: string, subId: string): string {
  return `${SUB_BASE_URL}/${subToken}?id=${subId}`;
}

/** Generate a random subscription token (32-char base64url) */
export function generateSubToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(24).toString("base64url");
}

/** Generate a stable numeric sub ID from email */
export function generateSubId(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return String(Math.abs(hash)).slice(0, 10).padEnd(10, "0");
}

// ─── UUID Management ─────────────────────────────────────────────

/** Generate a new UUID for an Xray user */
export function generateXrayUuid(): string {
  return uuidv4();
}

// ─── Connection String Builders ──────────────────────────────────

/** Build a VLESS connection URI */
export function buildVlessUri(
  uuid: string,
  email: string,
  config: XrayConfig = defaultConfig
): string {
  const params = new URLSearchParams({
    type: config.network,
    security: config.security,
    flow: config.flow,
    fp: config.fingerprint,
    sni: config.sni,
    pbk: config.publicKey,
    sid: config.shortId,
  });

  return `vless://${uuid}@${config.serverDomain}:${config.serverPort}?${params.toString()}#${encodeURIComponent(`Atlas Secure - ${email}`)}`;
}

/** Build a VMess connection URI (base64 encoded JSON) */
export function buildVmessUri(
  uuid: string,
  email: string,
  config: XrayConfig = defaultConfig
): string {
  const vmessConfig = {
    v: "2",
    ps: `Atlas Secure - ${email}`,
    add: config.serverDomain,
    port: config.serverPort,
    id: uuid,
    aid: 0,
    scy: "auto",
    net: config.network,
    type: "none",
    host: config.sni,
    tls: config.security === "tls" ? "tls" : "",
    sni: config.sni,
    fp: config.fingerprint,
  };

  const encoded = Buffer.from(JSON.stringify(vmessConfig)).toString("base64");
  return `vmess://${encoded}`;
}

/** Build a Trojan connection URI */
export function buildTrojanUri(
  password: string,
  email: string,
  config: XrayConfig = defaultConfig
): string {
  const params = new URLSearchParams({
    type: config.network,
    security: config.security,
    sni: config.sni,
    fp: config.fingerprint,
  });

  return `trojan://${password}@${config.serverDomain}:${config.serverPort}?${params.toString()}#${encodeURIComponent(`Atlas Secure - ${email}`)}`;
}

/** Build connection URI based on configured protocol */
export function buildConnectionUri(
  uuid: string,
  email: string,
  config: XrayConfig = defaultConfig
): string {
  switch (config.defaultProtocol) {
    case "vmess":
      return buildVmessUri(uuid, email, config);
    case "trojan":
      return buildTrojanUri(uuid, email, config);
    case "vless":
    default:
      return buildVlessUri(uuid, email, config);
  }
}

// ─── Xray FastAPI Client ─────────────────────────────────────────

const XRAY_API_URL = process.env.XRAY_API_URL || "https://api.mynewllcw.com";
const XRAY_API_KEY = process.env.XRAY_API_KEY || "";

/** Add a user to the Xray server via FastAPI */
export async function xrayAddUser(uuid: string): Promise<boolean> {
  try {
    const res = await fetch(`${XRAY_API_URL}/add-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": XRAY_API_KEY,
      },
      body: JSON.stringify({ uuid }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[XRAY] Failed to add user (UUID: ${uuid}): ${res.status} ${res.statusText}`);
      return false;
    }
    console.log(`[XRAY] User added: ${uuid}`);
    return true;
  } catch (error) {
    console.error(`[XRAY] Error adding user (UUID: ${uuid}):`, error);
    return false;
  }
}

/** Remove a user from the Xray server via FastAPI */
export async function xrayRemoveUser(uuid: string): Promise<boolean> {
  try {
    const res = await fetch(`${XRAY_API_URL}/remove-user/${uuid}`, {
      method: "POST",
      headers: {
        "x-api-key": XRAY_API_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[XRAY] Failed to remove user (UUID: ${uuid}): ${res.status} ${res.statusText}`);
      return false;
    }
    console.log(`[XRAY] User removed: ${uuid}`);
    return true;
  } catch (error) {
    console.error(`[XRAY] Error removing user (UUID: ${uuid}):`, error);
    return false;
  }
}

/** Check Xray API server health */
export async function xrayHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${XRAY_API_URL}/health`, {
      headers: { "x-api-key": XRAY_API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Xray Config JSON Builder ────────────────────────────────────

/** Generate the client entry for xray config.json */
export function buildXrayClientConfig(uuid: string, email: string, flow: string = "xtls-rprx-vision") {
  return {
    id: uuid,
    email,
    flow,
    level: 0,
  };
}

/**
 * Generate a complete inbound configuration snippet for xray config.json
 * This can be used to programmatically manage the server config
 */
export function buildInboundConfigSnippet(clients: Array<{ uuid: string; email: string }>) {
  return {
    clients: clients.map((c) => buildXrayClientConfig(c.uuid, c.email)),
  };
}
