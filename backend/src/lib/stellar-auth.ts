import * as StellarSdk from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { isValidStellarPublicKey } from './stellar-validator';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      address: string;
    };
  }
}

const DEFAULT_TEST_SERVER_SECRET =
  'SC6OZVTKCULUWQ5V7XCADXQ54YMELKKUYS4S32M4XJUNK727KBNKXRK7';

let serverKeypair: StellarSdk.Keypair;
if (
  config.STELLAR_SERVER_SECRET &&
  config.STELLAR_SERVER_SECRET.startsWith('S') &&
  config.STELLAR_SERVER_SECRET.length === 56
) {
  serverKeypair = StellarSdk.Keypair.fromSecret(config.STELLAR_SERVER_SECRET);
} else {
  // Deterministic server keypair for development & test environments
  serverKeypair = StellarSdk.Keypair.fromSecret(DEFAULT_TEST_SERVER_SECRET);
}

export function getServerKeypair(): StellarSdk.Keypair {
  return serverKeypair;
}

export function getNetworkPassphrase(): string {
  return config.STELLAR_NETWORK === 'PUBLIC'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;
}

// Anti-replay cache tracking used challenge transaction hashes
const usedChallenges = new Set<string>();

export interface ChallengeResponse {
  transaction: string;
  network_passphrase: string;
  server_public_key: string;
  domain: string;
  expires_at: string;
}

/**
 * Builds a Stellar SEP-10 compliant challenge transaction
 * @param clientAddress Stellar public key of the requesting wallet
 */
export function buildSep10Challenge(clientAddress: string): ChallengeResponse {
  if (!isValidStellarPublicKey(clientAddress)) {
    throw new Error(`Invalid Stellar address: ${clientAddress}`);
  }

  const network = getNetworkPassphrase();
  const domain = config.AUTH_DOMAIN;
  const timeout = config.AUTH_CHALLENGE_TIMEOUT;

  const challengeXdr = StellarSdk.WebAuth.buildChallengeTx(
    serverKeypair,
    clientAddress,
    domain,
    timeout,
    network,
    domain
  );

  return {
    transaction: challengeXdr,
    network_passphrase: network,
    server_public_key: serverKeypair.publicKey(),
    domain,
    expires_at: new Date(Date.now() + timeout * 1000).toISOString()
  };
}

/**
 * Verifies a signed Stellar SEP-10 challenge transaction
 * Validates transaction structure, server signature, expiration timebounds,
 * anti-replay status, and client signature.
 * @param signedXdr The signed transaction envelope XDR
 */
export function verifySep10Challenge(signedXdr: string): { address: string } {
  if (!signedXdr || typeof signedXdr !== 'string') {
    throw new Error('Challenge transaction XDR is required');
  }

  const network = getNetworkPassphrase();
  const domain = config.AUTH_DOMAIN;
  const serverPublicKey = serverKeypair.publicKey();

  // 1. Validate structure, domain, and server parameters via official WebAuth
  const read = StellarSdk.WebAuth.readChallengeTx(
    signedXdr,
    serverPublicKey,
    network,
    [domain],
    domain
  );

  const clientAddress = read.clientAccountID;
  if (!clientAddress || !isValidStellarPublicKey(clientAddress)) {
    throw new Error('Invalid or missing client account ID in challenge transaction');
  }

  const tx = new StellarSdk.Transaction(signedXdr, network);
  const txHash = Buffer.from(tx.hash()).toString('hex');

  // 2. Anti-replay protection
  if (usedChallenges.has(txHash)) {
    throw new Error('Challenge transaction has already been used (replay detected)');
  }

  // 3. Cryptographic signature verification
  const isSigned = StellarSdk.WebAuth.verifyTxSignedBy(tx, clientAddress);
  if (!isSigned) {
    // Direct Ed25519 Keypair fallback check
    let directValid = false;
    const clientKeypair = StellarSdk.Keypair.fromPublicKey(clientAddress);
    for (const sig of tx.signatures) {
      const sigBuffer = Buffer.isBuffer(sig.signature)
        ? sig.signature
        : Buffer.from((sig as any).signature);
      if (clientKeypair.verify(tx.hash(), sigBuffer)) {
        directValid = true;
        break;
      }
    }
    if (!directValid) {
      throw new Error(`Challenge transaction lacks a valid signature from ${clientAddress}`);
    }
  }

  // Mark as consumed for remaining validity window
  usedChallenges.add(txHash);
  setTimeout(() => usedChallenges.delete(txHash), config.AUTH_CHALLENGE_TIMEOUT * 1000);

  return { address: clientAddress };
}

export interface AuthTokenPayload {
  sub: string;
  address: string;
  iat?: number;
  exp?: number;
}

/**
 * Issues an authenticated JWT for a verified Stellar wallet address
 */
export function issueAuthToken(address: string): { token: string; expires_in: number } {
  const expiresInSeconds = 86400; // 24 hours
  const token = jwt.sign(
    { sub: address, address },
    config.JWT_SECRET,
    { expiresIn: (config.JWT_EXPIRES_IN || '24h') as any }
  );
  return { token, expires_in: expiresInSeconds };
}

/**
 * Validates and decodes a JWT token
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
}

/**
 * Fastify preHandler hook: requires an authenticated Stellar wallet session.
 * Rejects with 401 if missing, invalid, or expired.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      reqId: req.id,
      error: 'Unauthorized: Missing or invalid Authorization Bearer token'
    });
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = verifyAuthToken(token);
    req.user = { address: decoded.address };
  } catch (err: any) {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      reqId: req.id,
      error: 'Unauthorized: Token is expired or invalid'
    });
  }
}

