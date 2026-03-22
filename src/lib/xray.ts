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
  serverDomain: process.env.XRAY_SERVER_DOMAIN || "vpn.atlas-secure.com",
  serverPort: parseInt(process.env.XRAY_SERVER_PORT || "443"),
  defaultProtocol: (process.env.XRAY_PROTOCOL as "vless" | "vmess" | "trojan") || "vless",
  flow: process.env.XRAY_FLOW || "xtls-rprx-vision",
  network: process.env.XRAY_NETWORK || "tcp",
  security: process.env.XRAY_SECURITY || "reality",
  sni: process.env.XRAY_SNI || "www.google.com",
  fingerprint: process.env.XRAY_FINGERPRINT || "chrome",
  publicKey: process.env.XRAY_PUBLIC_KEY || "",
  shortId: process.env.XRAY_SHORT_ID || "",
};

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

// ─── Xray gRPC API Client (structure for future implementation) ──

export interface XrayApiClient {
  /** Add a user to an inbound */
  addUser(inboundTag: string, uuid: string, email: string, level?: number): Promise<boolean>;
  /** Remove a user from an inbound */
  removeUser(inboundTag: string, email: string): Promise<boolean>;
  /** Get user traffic stats */
  getUserStats(email: string): Promise<{ uplink: number; downlink: number } | null>;
  /** Reset user traffic counter */
  resetUserStats(email: string): Promise<boolean>;
}

/**
 * Xray API client stub.
 *
 * TODO: Implement actual gRPC communication with Xray.
 * Options:
 * 1. Use @grpc/grpc-js with Xray proto definitions
 * 2. Use a panel API (3x-ui, Marzban) as middleware
 * 3. Direct config.json manipulation + xray api restart
 *
 * Example implementation with 3x-ui panel:
 * ```typescript
 * async addUser(inboundTag, uuid, email) {
 *   const res = await fetch(`${panelUrl}/panel/api/inbounds/addClient`, {
 *     method: 'POST',
 *     headers: { 'Cookie': `session=${token}` },
 *     body: JSON.stringify({
 *       id: inboundId,
 *       settings: JSON.stringify({
 *         clients: [{ id: uuid, email, flow: 'xtls-rprx-vision' }]
 *       })
 *     })
 *   });
 *   return res.ok;
 * }
 * ```
 */
export function createXrayApiClient(_config: XrayConfig = defaultConfig): XrayApiClient {
  return {
    async addUser(_inboundTag: string, uuid: string, email: string, _level = 0): Promise<boolean> {
      console.log(`[XRAY] Adding user: ${email} (UUID: ${uuid})`);
      // TODO: Implement actual Xray API call
      return true;
    },

    async removeUser(_inboundTag: string, email: string): Promise<boolean> {
      console.log(`[XRAY] Removing user: ${email}`);
      // TODO: Implement actual Xray API call
      return true;
    },

    async getUserStats(email: string): Promise<{ uplink: number; downlink: number } | null> {
      console.log(`[XRAY] Getting stats for: ${email}`);
      // TODO: Implement actual Xray API call
      return { uplink: 0, downlink: 0 };
    },

    async resetUserStats(email: string): Promise<boolean> {
      console.log(`[XRAY] Resetting stats for: ${email}`);
      // TODO: Implement actual Xray API call
      return true;
    },
  };
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
