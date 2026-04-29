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
  serverDomain: process.env.XRAY_SERVER_DOMAIN || "77.221.156.97",
  serverPort: parseInt(process.env.XRAY_SERVER_PORT || "4443"),
  defaultProtocol: (process.env.XRAY_PROTOCOL as "vless" | "vmess" | "trojan") || "vless",
  flow: process.env.XRAY_FLOW || "xtls-rprx-vision",
  network: process.env.XRAY_NETWORK || "tcp",
  security: process.env.XRAY_SECURITY || "reality",
  sni: process.env.XRAY_SNI || "api-maps.yandex.ru",
  fingerprint: process.env.XRAY_FINGERPRINT || "chrome",
  publicKey: process.env.XRAY_PUBLIC_KEY || "6j_Z1QMNfGfLod_aBZdVWlt0nonNSVUt5Yg7sgpP9Co",
  shortId: process.env.XRAY_SHORT_ID || "a1b2c3d4",
};

// ─── Server Pool (all available servers) ─────────────────────────

export interface ServerEntry {
  name: string;
  ip: string;
  hostname?: string;
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
    name: "🇩🇪 Atlas Fast #1 ⚡️",
    ip: "77.221.156.97",
    hostname: "gastricsilver.aeza.network",
    port: 4443,
    sni: "api-maps.yandex.ru",
    fingerprint: "chrome",
    publicKey: "6j_Z1QMNfGfLod_aBZdVWlt0nonNSVUt5Yg7sgpP9Co",
    shortId: "a1b2c3d4",
    flow: "xtls-rprx-vision",
    network: "tcp",
    security: "reality",
  },
  {
    name: "🇩🇪 Atlas Fast #2 ⚡️",
    ip: "45.144.55.159",
    hostname: "atlas.aeza.network",
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
    name: "Для Обхода: /white",
    ip: "84.23.52.66",
    port: 8444,
    sni: "eh.vk.com",
    fingerprint: "chrome",
    publicKey: "AD3iu5zxfDZWeMEHSWTH5JuiokSv3ohQEg1Y_aUxzgA",
    shortId: "a1b2c3d4",
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

// ─── Direct domains for routing (category-ru bypass) ────────────

const DIRECT_DOMAINS = [
  "atlassecure.ru",
  // Сбер
  "sber.ru","sberbank.ru","sberbank.com","sbermarket.ru","online.sberbank.ru","api.sberbank.ru","api.developer.sber.ru","developers.sber.ru","fintech.sberbank.ru","sberdevices.ru","sberavto.com","sberhealth.ru","sberzvuk.ru","sberlogistics.ru","sbermegamarket.ru","sberfood.ru","sberclass.ru","sberinsur.ru","sbolbank.ru","salute.sber.ru","smartmarket.sber.ru",
  // Банки
  "tbank.ru","tinkoff.com","tinkoff.ru","tinkoff.business","tcsbank.ru","alfabank.ru","alfaclick.ru","alfabank.com","alfadirect.ru","vtb.ru","vtb24.ru","vtbbo.ru","gazprombank.ru","psbank.ru","raiffeisen.ru","rshb.ru","open.ru","openbroker.ru","sovcombank.ru","halvacard.ru","uralsib.ru","mkb.ru","rosbank.ru","unicreditbank.ru","homecredit.ru","otpbank.ru","pochtabank.ru","rencredit.ru","tochka.com","modulbank.ru","delo.ru","bspb.ru","nskbl.ru","absolutbank.ru","akbars.ru","centrinvest.ru","domrfbank.ru","svoi.ru","mtsbank.ru","rnkb.ru","primbank.ru","finam.ru","bcs.ru","broker.ru","moex.com",
  // Госсервисы
  "nalog.gov.ru","nalog.ru","lknpd.nalog.ru","fns.ru","gosuslugi.ru","esia.gosuslugi.ru","pos.gosuslugi.ru","dom.gosuslugi.ru","mos.ru","emias.info","emias.mos.ru","pfr.gov.ru","sfr.gov.ru","fss.ru","cbr.ru","rosreestr.gov.ru","rosreestr.ru","mvd.gov.ru","gibdd.ru","fssp.gov.ru","fsin.gov.ru","fas.gov.ru","customs.gov.ru","gov.ru","government.ru","kremlin.ru","duma.gov.ru","council.gov.ru","zakupki.gov.ru","torgi.gov.ru","bus.gov.ru","gu.spb.ru","uslugi.tatarstan.ru","dagov.ru","rpn.gov.ru","minzdrav.gov.ru","edu.gov.ru","minobrnauki.gov.ru","mintrud.gov.ru","minpromtorg.gov.ru","minstroyrf.gov.ru","mintrans.gov.ru","mcx.gov.ru","digital.gov.ru","mid.ru","mil.ru","rostrud.gov.ru","rospotrebnadzor.ru","roszdravnadzor.gov.ru","fstec.ru","rkn.gov.ru","genproc.gov.ru","sledcom.ru","sudrf.ru","arbitr.ru",
  // Маркетплейсы
  "wildberries.ru","wb.ru","wbstatic.net","wbbasket.ru","ozon.ru","ozon.st","avito.ru","avito.st","youla.ru","kazanexpress.ru","aliexpress.ru",
  // Доставка
  "cdek.ru","pochta.ru","russianpost.ru","boxberry.ru","dpd.ru","pecom.ru","dellin.ru","jde.ru","dostavista.ru","nrg-tk.ru","pek.ru","gtd.ru","baikalsr.ru","shiptor.ru","x5.ru",
  // Яндекс
  "yandex.ru","yandex.net","yandex.com","ya.ru","yastatic.net","yandexgo.ru","taxi.yandex.ru","go.yandex.ru","kinopoisk.ru","hd.kinopoisk.ru","yandexpay.ru","pay.yandex.ru","quasar.yandex.ru","alice.yandex.ru","dialogs.yandex.net","iot.quasar.yandex.ru","lavka.yandex.ru","market.yandex.ru","music.yandex.ru","disk.yandex.ru","cloud.yandex.ru","practicum.yandex.ru","zen.yandex.ru","dzen.ru","edadeal.ru","realty.yandex.ru","eda.yandex.ru",
  // Недвижимость
  "domclick.ru","domofond.ru","cian.ru","n1.ru","pik.ru","samolet.ru","lsr.ru","etagi.com","gis-zhkh.ru","reformagkh.ru",
  // Транспорт
  "aviasales.ru","aviasales.com","tutu.ru","rzd.ru","pobeda.aero","aeroflot.ru","s7.ru","utair.ru","nordwindairlines.ru","smartavia.ru","rossiya-airlines.com",
  // ТВ/Кино
  "ntv.ru","ntvplus.ru","1tv.ru","vgtrk.ru","russia.tv","smotrim.ru","ctc.ru","tnt-online.ru","rentv.ru","5-tv.ru","match.tv","matchtv.ru","tv-culture.ru","ivi.ru","okko.tv","start.ru","wink.ru","more.tv","premier.one","kion.ru","amediateka.ru","rutube.ru","vk.com","vk.me","vkvideo.ru",
  // Телеком
  "ttktv.ru","ttk.ru","domru.ru","rt.ru","rostelecom.ru","mts.ru","megafon.ru","beeline.ru","tele2.ru","yota.ru",
  // Работа
  "hh.ru","superjob.ru","rabota.ru","trudvsem.ru",
  // Ритейл
  "sportmaster.ru","mvideo.ru","eldorado.ru","dns-shop.ru","citilink.ru","lamoda.ru","letoile.ru","goldapple.ru","detmir.ru","litres.ru",
  // Еда
  "magnit.ru","lenta.com","perekrestok.ru","samokat.ru","dodo.ru","dodopizza.ru","delivery-club.ru","vkusvill.ru","pyaterochka.ru","dixy.ru","metro-cc.ru","globus.ru",
  // Карты
  "2gis.ru","2gis.com",
];

/** Build full Xray JSON configs for all servers (for Happ format=json) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildXrayJsonConfigs(uuid: string): any[] {
  return SERVER_POOL.map((server) => ({
    remarks: server.name,
    dns: {
      servers: [
        {
          address: "77.88.8.8",
          domains: ["geosite:category-ru"],
          detour: "direct",
        },
        {
          address: "https://8.8.8.8/dns-query",
          detour: "proxy",
        },
      ],
      tag: "dns-inbound",
      queryStrategy: "UseIPv4",
    },
    inbounds: [
      {
        tag: "socks-in",
        protocol: "socks",
        listen: "127.0.0.1",
        port: 10808,
        settings: { auth: "noauth", udp: true },
        sniffing: { enabled: true, destOverride: ["http", "tls", "fakedns"], routeOnly: true },
      },
      {
        tag: "http-in",
        protocol: "http",
        listen: "127.0.0.1",
        port: 10809,
        sniffing: { enabled: true, destOverride: ["http", "tls", "fakedns"], routeOnly: true },
      },
    ],
    outbounds: [
      {
        tag: "proxy",
        protocol: "vless",
        settings: {
          vnext: [
            {
              address: server.ip,
              port: server.port,
              users: [
                {
                  id: uuid,
                  encryption: "none",
                  flow: server.flow,
                },
              ],
            },
          ],
        },
        streamSettings: {
          network: server.network,
          security: server.security,
          realitySettings: {
            serverName: server.sni,
            fingerprint: server.fingerprint,
            publicKey: server.publicKey,
            shortId: server.shortId,
          },
        },
      },
      { tag: "direct", protocol: "freedom", settings: {} },
      { tag: "block", protocol: "blackhole", settings: {} },
      { tag: "dns-out", protocol: "dns", settings: {} },
    ],
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        { type: "field", inboundTag: ["dns-inbound"], outboundTag: "proxy" },
        { type: "field", port: "53", outboundTag: "dns-out" },
        { type: "field", protocol: ["bittorrent"], outboundTag: "block" },
        { type: "field", port: "443", network: "udp", outboundTag: "block" },
        { type: "field", ip: ["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"], outboundTag: "proxy" },
        { type: "field", domain: DIRECT_DOMAINS.filter(d => d === "atlassecure.ru").map(d => `full:${d}`), outboundTag: "proxy" },
        {
          type: "field",
          domain: [
            "geosite:category-ru",
            "geosite:apple",
            "geosite:yandex",
            "geosite:mailru",
            ...DIRECT_DOMAINS.filter(d => d !== "atlassecure.ru").map(d => `domain:${d}`),
          ],
          outboundTag: "direct",
        },
        { type: "field", ip: ["geoip:ru", "geoip:private"], outboundTag: "direct" },
        { type: "field", port: "0-65535", outboundTag: "proxy" },
      ],
    },
  }));
}

/** Build V2RayTun routing header (base64-encoded JSON) */
export function buildV2RayTunRoutingHeader(): string {
  const routing = {
    rules: [
      {
        type: "field",
        outboundTag: "proxy",
        domain: ["full:atlassecure.ru"],
        domainMatcher: "hybrid",
        __name__: "atlassecure-proxy",
        __id__: "a0000001-0001-0001-0001-000000000001",
      },
      {
        type: "field",
        outboundTag: "freedom",
        domain: [
          "geosite:category-ru",
          "geosite:apple",
          "geosite:yandex",
          "geosite:mailru",
          ...DIRECT_DOMAINS.filter(d => d !== "atlassecure.ru").map(d => `domain:${d}`),
        ],
        domainMatcher: "hybrid",
        __name__: "ru-direct",
        __id__: "a0000002-0002-0002-0002-000000000002",
      },
      {
        type: "field",
        outboundTag: "freedom",
        ip: ["geoip:ru", "geoip:private"],
        __name__: "ru-ip-direct",
        __id__: "a0000003-0003-0003-0003-000000000003",
      },
    ],
    name: "Atlas Secure",
    domainStrategy: "IPIfNonMatch",
    id: "a0000000-0000-0000-0000-000000000000",
    domainMatcher: "hybrid",
    balancers: [],
  };

  return Buffer.from(JSON.stringify(routing)).toString("base64");
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

const XRAY_API_URL = process.env.XRAY_API_URL || "https://api.flowgrocery.com";
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
