export enum CircleStatus {
  Forming = 'Forming',
  Active = 'Active',
  Completed = 'Completed',
  Defaulted = 'Defaulted',
}

export enum PayoutOrderMode {
  Fixed = 'Fixed',
  Randomized = 'Randomized',
  BidBased = 'BidBased',
}

export interface CircleData {
  id: string;
  creator: string;
  name: string; // Off-chain Supabase metadata
  description?: string;
  tokenAddress: string;
  contributionAmount: number; // in USDC
  intervalDays: number;
  memberCount: number;
  currentMemberCount: number;
  collateralRequired: number;
  currentCycle: number;
  status: CircleStatus;
  payoutOrderMode: PayoutOrderMode;
  payoutSchedule: string[]; // Wallet addresses in payout order
}

export interface MemberData {
  address: string;
  displayName?: string;
  avatarUrl?: string;
  collateralDeposited: number;
  hasReceivedPayout: boolean;
  reputationScore: number;
}

export interface CycleContributionStatus {
  cycleIndex: number;
  memberAddress: string;
  hasPaid: boolean;
  paidTimestamp?: string;
}
