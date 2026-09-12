/**
 * Response fixtures in the shape of @remnawave/backend-contract 3.4.13
 * (backend tag 3.4.3): libs/contract/models/users.schema.ts,
 * extended-users.schema.ts, user-traffic.schema.ts, and the error
 * envelopes of src/common/exception/http-exception.filter.ts.
 */

import { parsePanelUser, PanelUser } from "../remnawave";

const DAY = 24 * 60 * 60 * 1000;

/** Raw `response` object of GET /api/users/{id} (ExtendedUsersSchema). */
export function contractUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1234,
    shortUuid: "Xk3pQ9vT2mL8nR4s",
    username: "ST00000042",
    status: "ACTIVE",
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
    expireAt: new Date(Date.now() + 30 * DAY).toISOString(),
    telegramId: null,
    email: "u@example.com",
    description: "atlas-site:11111111-2222-3333-4444-555555555555",
    tag: "SITE_BASIC",
    hwidDeviceLimit: 14,
    externalSquadUuid: null,
    trojanPassword: "tp_0123456789abcdef0123456789abcd",
    vlessUuid: "5f1b8a3e-0c2d-4f5e-9a7b-1c2d3e4f5a6b",
    ssPassword: "ss_0123456789abcdef0123456789abcd",
    lastTriggeredThreshold: 0,
    subRevokedAt: null,
    lastTrafficResetAt: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-10T10:00:00.000Z",
    subscriptionUrl: "https://sub.atlassecure.ru/Xk3pQ9vT2mL8nR4s",
    activeInternalSquads: [{ uuid: "squad-uuid-xyz", name: "MainServer" }],
    userTraffic: {
      usedTrafficBytes: 1048576,
      lifetimeUsedTrafficBytes: 2097152,
      onlineAt: null,
      firstConnectedAt: "2026-09-02T10:00:00.000Z",
      lastConnectedNodeUuid: null,
    },
    ...overrides,
  };
}

export function panelUser(overrides: Record<string, unknown> = {}): PanelUser {
  const u = parsePanelUser(contractUser(overrides));
  if (!u) throw new Error("fixture did not parse");
  return u;
}

/** 404 envelope for an unknown user (ERRORS.USER_NOT_FOUND). */
export const ERR_USER_NOT_FOUND = { timestamp: "2026-09-12T10:00:00.000Z", path: "/api/users/9999", message: "User not found", errorCode: "A025" };
/** 400 envelope for a duplicate username (ERRORS.USER_USERNAME_ALREADY_EXISTS). */
export const ERR_USERNAME_EXISTS = { timestamp: "2026-09-12T10:00:00.000Z", path: "/api/users", message: "User username already exists", errorCode: "A019" };
/** 400 envelope from nestjs-zod for a schema violation. */
export const ERR_VALIDATION = {
  statusCode: 400,
  message: "Validation failed",
  errors: [{ code: "invalid_format", path: ["expireAt"], message: "Expiration date cannot be in the past" }],
};
