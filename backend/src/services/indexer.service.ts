import * as StellarSdk from '@stellar/stellar-sdk';
import { prisma } from '../db';
import { config } from '../config';
import { logger } from '../logger';
import { profilesRepository } from '../repositories/profiles.repository';

export interface ParsedEvent {
  id: string;
  txHash: string;
  ledger: number;
  eventName: string;
  circleId: bigint;
  data: any;
}

export class SorobanEventIndexer {
  private rpcServer: StellarSdk.rpc.Server;
  private contractId: string;
  private pollIntervalMs: number;
  private lastLedger: number | null = null;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(rpcUrl?: string, contractId?: string, pollIntervalMs?: number) {
    const url = rpcUrl || config.STELLAR_RPC_URL;
    this.rpcServer = new StellarSdk.rpc.Server(url, {
      allowHttp: url.startsWith('http://')
    });
    this.contractId = contractId || config.STELLAR_CONTRACT_ID;
    this.pollIntervalMs = pollIntervalMs || config.INDEXER_POLL_INTERVAL_MS;
    if (config.INDEXER_START_LEDGER) {
      this.lastLedger = config.INDEXER_START_LEDGER;
    }
  }

  public setLastLedger(ledger: number) {
    this.lastLedger = ledger;
  }

  public getLastLedger(): number | null {
    return this.lastLedger;
  }

  /**
   * Starts the background indexing worker daemon
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(
      `[Soroban Indexer] Starting event indexer daemon for contract ${this.contractId} (interval: ${this.pollIntervalMs}ms)`
    );

    const runLoop = async () => {
      if (!this.isRunning) return;
      try {
        await this.pollOnce();
      } catch (err: any) {
        logger.error(`[Soroban Indexer] Polling iteration error: ${err.message || err}`);
      } finally {
        if (this.isRunning) {
          this.pollTimer = setTimeout(runLoop, this.pollIntervalMs);
        }
      }
    };

    // Trigger initial poll
    runLoop();
  }

  /**
   * Stops the background indexing worker daemon
   */
  public stop() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    logger.info('[Soroban Indexer] Event indexer daemon stopped.');
  }

  /**
   * Performs a single fetch and index pass over the Soroban RPC getEvents endpoint
   */
  public async pollOnce(): Promise<number> {
    try {
      if (this.lastLedger === null) {
        const latest = await this.rpcServer.getLatestLedger();
        // Look back up to 50 ledgers on startup
        this.lastLedger = Math.max(1, latest.sequence - 50);
        logger.info(`[Soroban Indexer] Initialized checkpoint to ledger ${this.lastLedger}`);
      }

      const response = await this.rpcServer.getEvents({
        startLedger: this.lastLedger + 1,
        filters: [
          {
            type: 'contract',
            contractIds: [this.contractId]
          }
        ],
        limit: 100
      });

      const events = response.events || [];
      let processedCount = 0;

      for (const rawEvent of events) {
        try {
          const parsed = this.parseRawEvent(rawEvent);
          if (parsed) {
            await this.processEvent(parsed);
            processedCount++;
          }
        } catch (eventErr: any) {
          logger.warn(`[Soroban Indexer] Failed to process event ${rawEvent.id}: ${eventErr.message}`);
        }
      }

      if (response.latestLedger && response.latestLedger > this.lastLedger) {
        this.lastLedger = response.latestLedger;
      }

      return processedCount;
    } catch (err: any) {
      logger.debug(`[Soroban Indexer] RPC poll error: ${err.message || err}`);
      return 0;
    }
  }

  /**
   * Parses a raw Soroban RPC event into strongly-typed domain representations
   */
  public parseRawEvent(rawEvent: any): ParsedEvent | null {
    if (!rawEvent.topic || !Array.isArray(rawEvent.topic) || rawEvent.topic.length < 2) {
      return null;
    }

    const eventNameVal = StellarSdk.scValToNative(rawEvent.topic[0]);
    const circleIdVal = StellarSdk.scValToNative(rawEvent.topic[1]);

    const eventName = String(eventNameVal);
    const circleId = BigInt(circleIdVal.toString());

    let data: any = null;
    if (rawEvent.value) {
      data = StellarSdk.scValToNative(rawEvent.value);
    }

    return {
      id: rawEvent.id,
      txHash: rawEvent.txHash || '',
      ledger: rawEvent.ledger || 0,
      eventName,
      circleId,
      data
    };
  }

  /**
   * Dispatches and writes verified on-chain event data directly into PostgreSQL
   */
  public async processEvent(event: ParsedEvent): Promise<void> {
    logger.info(
      `[Soroban Indexer] Processing on-chain event '${event.eventName}' for Circle #${event.circleId} (tx: ${event.txHash})`
    );

    switch (event.eventName) {
      case 'created':
        await this.handleCircleCreated(event);
        break;
      case 'joined':
        await this.handleMemberJoined(event);
        break;
      case 'activated':
        await this.handleCircleActivated(event);
        break;
      case 'cycle_pay':
        await this.handleCyclePayment(event);
        break;
      case 'payout':
        await this.handlePayoutReleased(event);
        break;
      case 'completed':
        await this.handleCircleCompleted(event);
        break;
      case 'slashed':
      case 'defaulted':
        await this.handleDefault(event);
        break;
      case 'unwound':
        await this.handleEmergencyUnwind(event);
        break;
      case 'left':
        await this.handleMemberLeft(event);
        break;
      case 'cancelled':
        await this.handleCircleCancelled(event);
        break;
      case 'shuffled':
        await this.handleCircleShuffled(event);
        break;
      case 'bid':
        await this.handleBidSubmitted(event);
        break;
      case 'bid_win':
        await this.handleBidWin(event);
        break;
      default:
        logger.debug(`[Soroban Indexer] Unhandled event topic: ${event.eventName}`);
    }
  }

  // 1. Circle Created Event Handler
  private async handleCircleCreated(event: ParsedEvent) {
    // data: [creator, token_address, contribution_amount, member_count, interval]
    const [creator, tokenAddress, contribStroops, memberCount, intervalSeconds] = Array.isArray(
      event.data
    )
      ? event.data
      : [event.data?.creator, event.data?.token_address, event.data?.contribution_amount, event.data?.member_count, event.data?.interval];

    const contributionDecimal = Number(contribStroops || 0) / 10_000_000;
    const intervalDays = Math.max(1, Math.floor(Number(intervalSeconds || 604800) / 86400));
    const members = Number(memberCount || 5);

    await prisma.circleMetadata.upsert({
      where: { circle_id: event.circleId },
      update: {
        creator_address: String(creator),
        token_address: String(tokenAddress),
        contribution_amount: contributionDecimal,
        interval_days: intervalDays,
        member_count: members
      },
      create: {
        circle_id: event.circleId,
        name: `Circle #${event.circleId}`,
        description: 'Auto-indexed on-chain Soroban rotating savings pool',
        creator_address: String(creator),
        token_address: String(tokenAddress || 'USDC'),
        contribution_amount: contributionDecimal,
        interval_days: intervalDays,
        member_count: members,
        status: 'Forming',
        members: {
          create: {
            wallet_address: String(creator),
            collateral_staked: 0,
            payout_order_index: 0
          }
        }
      }
    });
  }

  // 2. Member Joined Event Handler
  private async handleMemberJoined(event: ParsedEvent) {
    // data: [member_address, collateral_required, member_count]
    const [memberAddress, collateralStroops] = Array.isArray(event.data)
      ? event.data
      : [event.data?.member_address, event.data?.collateral_required];

    if (!memberAddress) return;

    const collateralDecimal = Number(collateralStroops || 0) / 10_000_000;

    await prisma.circleMember.upsert({
      where: {
        circle_id_wallet_address: {
          circle_id: event.circleId,
          wallet_address: String(memberAddress)
        }
      },
      update: {
        collateral_staked: collateralDecimal
      },
      create: {
        circle_id: event.circleId,
        wallet_address: String(memberAddress),
        collateral_staked: collateralDecimal
      }
    });

    // Update member profile collateral total
    await prisma.userProfile.upsert({
      where: { wallet_address: String(memberAddress) },
      update: {
        total_collateral_staked: { increment: collateralDecimal }
      },
      create: {
        wallet_address: String(memberAddress),
        total_collateral_staked: collateralDecimal
      }
    });
  }

  // 3. Circle Activated Event Handler
  private async handleCircleActivated(event: ParsedEvent) {
    await prisma.circleMetadata.updateMany({
      where: { circle_id: event.circleId },
      data: { status: 'Active' }
    });
  }

  // 4. Cycle Payment (Contribute) Event Handler
  private async handleCyclePayment(event: ParsedEvent) {
    // data: [member_address, amount, current_cycle]
    const [memberAddress, amountStroops, cycleIndex] = Array.isArray(event.data)
      ? event.data
      : [event.data?.member_address, event.data?.amount, event.data?.current_cycle];

    if (!memberAddress) return;

    const amountDecimal = Number(amountStroops || 0) / 10_000_000;
    const cycle = Number(cycleIndex || 0);

    // Write verified contribution to DB
    await prisma.contribution.create({
      data: {
        circle_id: event.circleId,
        cycle_index: cycle,
        member_address: String(memberAddress),
        amount: amountDecimal,
        status: 'verified',
        tx_hash: event.txHash || null
      }
    });

    // Increment punctual contributions on verified on-chain payment
    await profilesRepository.incrementPunctualContributions(String(memberAddress));

    // Log reputation bump
    await prisma.reputationLog.create({
      data: {
        wallet_address: String(memberAddress),
        circle_id: event.circleId,
        event_type: 'onchain_contribution',
        score_change: 2,
        reason: `Verified on-chain contribution in cycle #${cycle + 1} (ledger #${event.ledger})`
      }
    });
  }

  // 5. Pot Payout Released Event Handler
  private async handlePayoutReleased(event: ParsedEvent) {
    // data: [recipient, total_payout, completed_cycle]
    const [recipient, totalPayoutStroops, cycleIndex] = Array.isArray(event.data)
      ? event.data
      : [event.data?.recipient, event.data?.total_payout, event.data?.completed_cycle];

    if (!recipient) return;

    const payoutDecimal = Number(totalPayoutStroops || 0) / 10_000_000;
    const cycle = Number(cycleIndex || 0);

    await prisma.circleMember.updateMany({
      where: {
        circle_id: event.circleId,
        wallet_address: String(recipient)
      },
      data: { payout_received: true }
    });

    await prisma.notification.create({
      data: {
        wallet_address: String(recipient),
        circle_id: event.circleId,
        message: `On-chain verified payout of ${payoutDecimal} USDC released for Cycle #${cycle + 1}!`,
        notification_type: 'payout_released'
      }
    });
  }

  // 6. Circle Completed Event Handler
  private async handleCircleCompleted(event: ParsedEvent) {
    await prisma.circleMetadata.updateMany({
      where: { circle_id: event.circleId },
      data: { status: 'Completed' }
    });

    // Increment circles_completed for all participating members
    const members = await prisma.circleMember.findMany({
      where: { circle_id: event.circleId }
    });

    for (const m of members) {
      await prisma.userProfile.updateMany({
        where: { wallet_address: m.wallet_address },
        data: { circles_completed: { increment: 1 } }
      });
    }
  }

  // 7. Default & Slashing Event Handler
  private async handleDefault(event: ParsedEvent) {
    const [defaulter] = Array.isArray(event.data) ? event.data : [event.data?.defaulter];

    if (defaulter) {
      await prisma.reputationLog.create({
        data: {
          wallet_address: String(defaulter),
          circle_id: event.circleId,
          event_type: 'collateral_slashed',
          score_change: -25,
          reason: `Defaulted on cycle deposit; collateral liquidated into pool on-chain.`
        }
      });
    }
  }

  // 8. Emergency Unwind Event Handler
  private async handleEmergencyUnwind(event: ParsedEvent) {
    await prisma.circleMetadata.updateMany({
      where: { circle_id: event.circleId },
      data: { status: 'Terminated' }
    });
  }

  // 9. Member Left Forming Circle Event Handler
  private async handleMemberLeft(event: ParsedEvent) {
    const [memberAddress, refundStroops] = Array.isArray(event.data)
      ? event.data
      : [event.data?.member_address, event.data?.refund_amount];

    if (!memberAddress) return;
    const refundDecimal = Number(refundStroops || 0) / 10_000_000;

    await prisma.circleMember.deleteMany({
      where: {
        circle_id: event.circleId,
        wallet_address: String(memberAddress)
      }
    });

    await prisma.userProfile.updateMany({
      where: { wallet_address: String(memberAddress) },
      data: {
        total_collateral_staked: { decrement: refundDecimal }
      }
    });
  }

  // 10. Circle Cancelled Event Handler
  private async handleCircleCancelled(event: ParsedEvent) {
    await prisma.circleMetadata.updateMany({
      where: { circle_id: event.circleId },
      data: { status: 'Cancelled' }
    });
  }

  // 11. Circle Shuffled Event Handler (Randomized Mode)
  private async handleCircleShuffled(event: ParsedEvent) {
    logger.info(`[Soroban Indexer] Circle #${event.circleId} payout schedule shuffled on-chain`);
    await prisma.circleMetadata.updateMany({
      where: { circle_id: event.circleId },
      data: { payout_mode: 'Randomized' }
    });
  }

  // 12. Auction Bid Submitted Event Handler (BidBased Mode)
  private async handleBidSubmitted(event: ParsedEvent) {
    const [bidder, cycleIndex, discountStroops] = Array.isArray(event.data)
      ? event.data
      : [event.data?.bidder, event.data?.cycle_index, event.data?.discount_amount];

    if (!bidder) return;
    const discountDecimal = Number(discountStroops || 0) / 10_000_000;
    const cycle = Number(cycleIndex || 0);

    await prisma.notification.create({
      data: {
        wallet_address: String(bidder),
        circle_id: event.circleId,
        message: `Auction bid submitted with $${discountDecimal} discount for Cycle #${cycle + 1}!`,
        notification_type: 'bid_submitted'
      }
    });
  }

  // 13. Auction Pot & Dividend Released Event Handler (BidBased Mode)
  private async handleBidWin(event: ParsedEvent) {
    const [winner, winnerPotStroops, _winningDiscount, dividendStroops] = Array.isArray(event.data)
      ? event.data
      : [event.data?.winner, event.data?.winner_pot, event.data?.winning_discount, event.data?.dividend_per_other_member];

    if (!winner) return;
    const winnerPot = Number(winnerPotStroops || 0) / 10_000_000;
    const dividend = Number(dividendStroops || 0) / 10_000_000;

    await prisma.circleMember.updateMany({
      where: {
        circle_id: event.circleId,
        wallet_address: String(winner)
      },
      data: { payout_received: true }
    });

    await prisma.notification.create({
      data: {
        wallet_address: String(winner),
        circle_id: event.circleId,
        message: `You won the cycle pot auction with a payout of $${winnerPot} USDC!`,
        notification_type: 'bid_won'
      }
    });

    if (dividend > 0) {
      const otherMembers = await prisma.circleMember.findMany({
        where: {
          circle_id: event.circleId,
          wallet_address: { not: String(winner) }
        }
      });

      for (const m of otherMembers) {
        await prisma.notification.create({
          data: {
            wallet_address: m.wallet_address,
            circle_id: event.circleId,
            message: `Auction dividend bonus of $${dividend} USDC credited from winning bid discount!`,
            notification_type: 'auction_dividend'
          }
        });
      }
    }
  }
}

export const indexerService = new SorobanEventIndexer();

