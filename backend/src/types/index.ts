export type CircleStatus = 'Forming' | 'Active' | 'Completed' | 'Defaulted';
export type PayoutMode = 'Fixed' | 'Randomized' | 'BidBased';

export interface CircleMetadata {
  circle_id: string; // Maps to Soroban u64 ID
  name: string;
  description: string;
  category: string;
  creator_address: string;
  token_address: string;
  contribution_amount: number;
  interval_days: number;
  member_count: number;
  collateral_required: number;
  payout_mode: PayoutMode;
  status: CircleStatus;
  current_cycle?: number;
  current_members?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CircleMember {
  id?: string;
  circle_id: string;
  wallet_address: string;
  collateral_staked: number;
  payout_received: boolean;
  payout_order_index?: number;
  joined_at?: string;
}

export interface UserProfile {
  wallet_address: string;
  username?: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  reputation_score: number;
  circles_completed: number;
  punctual_contributions: number;
  total_collateral_staked: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContributionRecord {
  id?: string;
  circle_id: string;
  cycle_index: number;
  member_address: string;
  amount: number;
  status: 'paid' | 'pending' | 'defaulted';
  tx_hash?: string;
  paid_at?: string;
}

export interface NotificationRecord {
  id?: string;
  wallet_address: string;
  circle_id: string;
  message: string;
  notification_type: 'contribution_due' | 'payout_received' | 'default_warning' | 'circle_full';
  is_read: boolean;
  created_at?: string;
}

export interface ReputationLog {
  id?: string;
  wallet_address: string;
  circle_id?: string;
  event_type: string;
  score_change: number;
  reason?: string;
  created_at?: string;
}
