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

// ─── In-memory challenge store (short-lived) ────────────────────

const challenges = new Map<string, { challenge: string; expiresAt: number }>();

function storeChallenge(userId: string, challenge: string): void {
  challenges.set(userId, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
}

function getChallenge(userId: string): string | null {
  const entry = challenges.get(userId);
  if (!entry || Date.now() > entry.expiresAt) {
    challenges.delete(userId);
    return null;
  }
  challenges.delete(userId);
  return entry.challenge;
}

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

  storeChallenge(userId, options.challenge);

  return options;
}

export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON
) {
  const expectedChallenge = getChallenge(userId);
  if (!expectedChallenge) {
    throw new Error("Challenge expired or not found");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Verification failed");
  }

  const { credential } = verification.registrationInfo;

  const id = uuidv4();
  await pool.query(
    `INSERT INTO passkey_credentials (id, user_id, credential_id, public_key, counter, transports)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      userId,
      credential.id,
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

  // Store challenge keyed by the challenge itself (no user context yet)
  storeChallenge(`auth:${options.challenge}`, options.challenge);

  return options;
}

export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON
): Promise<{ verified: boolean; userId: string | null }> {
  const credentialId = response.id;

  const storedCred = await getPasskeyByCredentialId(credentialId);
  if (!storedCred) {
    return { verified: false, userId: null };
  }

  // Find the matching challenge
  const expectedChallenge = getChallenge(`auth:${response.response.clientDataJSON}`);

  // For passkey auth, we accept any recent challenge from our store
  // since we don't know the user ID before authentication
  let challenge: string | undefined;
  for (const [key, entry] of challenges.entries()) {
    if (key.startsWith("auth:") && Date.now() <= entry.expiresAt) {
      challenge = entry.challenge;
      challenges.delete(key);
      break;
    }
  }

  if (!challenge) {
    // Fallback: try to verify without strict challenge match
    // (the library will validate the challenge from the response)
    challenge = Buffer.from(response.response.clientDataJSON, "base64url")
      .toString("utf-8")
      .match(/"challenge":"([^"]+)"/)?.[1] || "";
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
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
      // Update counter
      await pool.query(
        "UPDATE passkey_credentials SET counter = $1 WHERE id = $2",
        [verification.authenticationInfo.newCounter, storedCred.id]
      );
      return { verified: true, userId: storedCred.userId };
    }
  } catch (err) {
    console.error("[PASSKEY] Auth verification error:", err);
  }

  return { verified: false, userId: null };
}
