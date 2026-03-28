import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { pool } from "./db";
import { v4 as uuidv4 } from "uuid";

const RP_NAME = "Atlas Secure";
const RP_ID = process.env.PASSKEY_RP_ID || "atlassecure.uk";
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || `https://${RP_ID}`;

// ─── Challenge store (short-lived, in-memory) ───────────────────

const challenges = new Map<string, { challenge: string; expiresAt: number }>();

function storeChallenge(key: string, challenge: string): void {
  challenges.set(key, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
}

function consumeChallenge(key: string): string | null {
  const entry = challenges.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    challenges.delete(key);
    return null;
  }
  challenges.delete(key);
  return entry.challenge;
}

// Cleanup expired challenges periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of challenges) {
    if (now > entry.expiresAt) challenges.delete(key);
  }
}, 60_000);

// ─── DB operations ──────────────────────────────────────────────

interface PasskeyCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string | null;
}

async function getUserPasskeys(userId: string): Promise<PasskeyCredential[]> {
  const result = await pool.query(
    "SELECT id, credential_id, public_key, counter, transports FROM passkey_credentials WHERE user_id = $1",
    [userId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    credentialId: r.credential_id,
    publicKey: r.public_key,
    counter: Number(r.counter),
    transports: r.transports,
  }));
}

async function getPasskeyByCredentialId(credentialId: string): Promise<(PasskeyCredential & { userId: string }) | null> {
  const result = await pool.query(
    "SELECT id, user_id, credential_id, public_key, counter, transports FROM passkey_credentials WHERE credential_id = $1",
    [credentialId]
  );
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    credentialId: r.credential_id,
    publicKey: r.public_key,
    counter: Number(r.counter),
    transports: r.transports,
  };
}

export async function userHasPasskey(userId: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM passkey_credentials WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return result.rows.length > 0;
}

// ─── Registration ───────────────────────────────────────────────

export async function generatePasskeyRegistration(userId: string, userEmail: string) {
  const existingKeys = await getUserPasskeys(userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userEmail,
    userDisplayName: userEmail,
    attestationType: "none",
    excludeCredentials: existingKeys.map((k) => ({
      id: k.credentialId,
      transports: k.transports ? (k.transports.split(",") as AuthenticatorTransportFuture[]) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  storeChallenge(`reg:${userId}`, options.challenge);
  return options;
}

export async function verifyPasskeyRegistration(userId: string, response: RegistrationResponseJSON) {
  const expectedChallenge = consumeChallenge(`reg:${userId}`);
  if (!expectedChallenge) throw new Error("Challenge expired");

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) throw new Error("Verification failed");

  const { credential } = verification.registrationInfo;
  const id = uuidv4();
  await pool.query(
    `INSERT INTO passkey_credentials (id, user_id, credential_id, public_key, counter, transports)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id, userId, credential.id,
      Buffer.from(credential.publicKey).toString("base64"),
      credential.counter,
      credential.transports ? credential.transports.join(",") : null,
    ]
  );

  return { verified: true };
}

// ─── Authentication ─────────────────────────────────────────────

export async function generatePasskeyAuthentication() {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
  });

  // Key by challenge value so we can find it during verification
  storeChallenge(`auth:${options.challenge}`, options.challenge);
  return options;
}

export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON
): Promise<{ verified: boolean; userId: string | null }> {
  const storedCred = await getPasskeyByCredentialId(response.id);
  if (!storedCred) return { verified: false, userId: null };

  // Extract challenge from clientDataJSON to find the stored challenge
  let clientChallenge: string;
  try {
    const clientData = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8"));
    clientChallenge = clientData.challenge;
  } catch {
    return { verified: false, userId: null };
  }

  const expectedChallenge = consumeChallenge(`auth:${clientChallenge}`);
  if (!expectedChallenge) return { verified: false, userId: null };

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCred.credentialId,
        publicKey: Buffer.from(storedCred.publicKey, "base64"),
        counter: storedCred.counter,
        transports: storedCred.transports
          ? (storedCred.transports.split(",") as AuthenticatorTransportFuture[])
          : undefined,
      },
    });

    if (verification.verified) {
      await pool.query(
        "UPDATE passkey_credentials SET counter = $1 WHERE id = $2",
        [verification.authenticationInfo.newCounter, storedCred.id]
      );
      return { verified: true, userId: storedCred.userId };
    }
  } catch (err) {
    console.error("[PASSKEY] Auth error:", err);
  }

  return { verified: false, userId: null };
}
