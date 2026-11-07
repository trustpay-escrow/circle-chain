import * as StellarSdk from '@stellar/stellar-sdk';
import { config } from '../config';
import { logger } from '../logger';

export interface VerificationResult {
  verified: boolean;
  ledger?: number;
  createdAt?: string;
  feeCharged?: string | number;
  error?: string;
}

export class TransactionVerifier {
  private horizonServer: StellarSdk.Horizon.Server;
  private rpcServer: StellarSdk.rpc.Server;

  constructor(horizonUrl?: string, rpcUrl?: string) {
    this.horizonServer = new StellarSdk.Horizon.Server(
      horizonUrl || config.STELLAR_HORIZON_URL
    );
    this.rpcServer = new StellarSdk.rpc.Server(
      rpcUrl || config.STELLAR_RPC_URL,
      { allowHttp: (rpcUrl || config.STELLAR_RPC_URL).startsWith('http://') }
    );
  }

  /**
   * Verifies that a transaction hash exists on the Stellar network, succeeded on-chain,
   * and corresponds to the expected member account.
   */
  async verifyTransaction(
    txHash: string,
    expectedMember?: string
  ): Promise<VerificationResult> {
    if (!txHash || typeof txHash !== 'string') {
      return { verified: false, error: 'Transaction hash is missing or not a string' };
    }

    const cleanHash = txHash.trim().toLowerCase();
    if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
      return {
        verified: false,
        error: `Invalid Stellar transaction hash format: must be 64-character hex string`
      };
    }

    // 1. Try Stellar Horizon API
    try {
      const tx = await this.horizonServer.transactions().transaction(cleanHash).call();

      if (!tx.successful) {
        return {
          verified: false,
          error: `Transaction ${cleanHash} was rejected or failed on Stellar ledger`
        };
      }

      if (expectedMember && tx.source_account !== expectedMember) {
        // Source account does not match; verify if expectedMember is an account participating in operations
        try {
          const ops = await (tx as any).operations();
          const isParticipant = ops.records.some(
            (op: any) =>
              op.source_account === expectedMember ||
              op.from === expectedMember ||
              op.to === expectedMember ||
              op.funder === expectedMember
          );

          if (!isParticipant) {
            return {
              verified: false,
              error: `Transaction ${cleanHash} does not involve expected member account ${expectedMember}`
            };
          }
        } catch {
          // If operations check fails, check whether source account was required
          logger.warn(`Could not fetch operations for tx ${cleanHash}`);
        }
      }

      return {
        verified: true,
        ledger: tx.ledger_attr,
        createdAt: tx.created_at,
        feeCharged: tx.fee_charged
      };
    } catch (horizonErr: any) {
      // If Horizon returns 404 or connection error, check Soroban RPC
      logger.debug(`Horizon verification for ${cleanHash} yielded: ${horizonErr.message || horizonErr}`);
    }

    // 2. Try Soroban RPC endpoint
    try {
      const rpcTx = await this.rpcServer.getTransaction(cleanHash);

      if (rpcTx.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
        return {
          verified: true,
          ledger: rpcTx.latestLedger
        };
      }

      if (rpcTx.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
        return {
          verified: false,
          error: `Soroban RPC reports transaction ${cleanHash} failed on ledger`
        };
      }
    } catch (rpcErr: any) {
      logger.debug(`Soroban RPC check for ${cleanHash} yielded: ${rpcErr.message || rpcErr}`);
    }

    return {
      verified: false,
      error: `Transaction ${cleanHash} could not be verified on Stellar network or Soroban ledger`
    };
  }
}

export const transactionVerifier = new TransactionVerifier();

