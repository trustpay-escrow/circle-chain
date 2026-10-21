const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface CircleMemberData {
  id?: string;
  circle_id: number;
  wallet_address: string;
  collateral_staked: number;
  payout_order_index?: number;
  payout_received?: boolean;
  joined_at?: string;
}

export interface ContributionData {
  id?: string;
  circle_id: number;
  cycle_index: number;
  member_address: string;
  amount: number;
  status: string;
  tx_hash?: string;
  paid_at?: string;
}

export interface CircleData {
  circle_id: number;
  name: string;
  description: string;
  category?: string;
  creator_address: string;
  token_address?: string;
  contribution_amount: number;
  interval_days: number;
  member_count: number;
  collateral_required: number;
  payout_mode?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  members?: CircleMemberData[];
  contributions?: ContributionData[];
}

export interface UserProfileData {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  reputation_score?: number;
  circles_completed?: number;
  punctual_contributions?: number;
  total_collateral_staked?: number;
}

// 1. Fetch all savings circles from Prisma backend
export async function fetchCircles(): Promise<CircleData[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.circles && Array.isArray(data.circles)) {
        return data.circles;
      }
    }
  } catch (err) {
    console.error('[CircleChain API] Failed to fetch circles from backend:', err);
  }

  return [];
}

// 2. Fetch single circle by ID from Prisma backend
export async function fetchCircleById(id: string): Promise<CircleData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles/${id}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.circle) {
        return data.circle;
      }
    }
  } catch (err) {
    console.error(`[CircleChain API] Failed to fetch circle #${id}:`, err);
  }

  return null;
}

// 3. Create a new circle via Prisma backend
export async function createCircleApi(
  payload: Omit<CircleData, 'circle_id' | 'status'> & { circle_id?: number }
): Promise<CircleData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.circle) return data.circle;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }
  } catch (err) {
    console.error('[CircleChain API] Create circle failed:', err);
    throw err;
  }

  return null;
}

// 4. Join a circle (stake collateral & add to roster)
export async function joinCircleApi(
  circleId: number,
  walletAddress: string,
  collateralStaked: number
): Promise<{ success: boolean; member?: CircleMemberData; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles/${circleId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        collateral_staked: collateralStaked
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, member: data.member };
    }
    return { success: false, error: data.error || 'Failed to join circle' };
  } catch (err: any) {
    console.error(`[CircleChain API] Failed to join circle #${circleId}:`, err);
    return { success: false, error: err.message || 'Network error joining circle' };
  }
}

// 5. Record cycle contribution payment
export async function recordContributionApi(payload: {
  circle_id: number;
  cycle_index: number;
  member_address: string;
  amount: number;
  tx_hash?: string;
}): Promise<{ success: boolean; data?: ContributionData; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, data: data.data };
    }
    return { success: false, error: data.error || 'Failed to record contribution' };
  } catch (err: any) {
    console.error('[CircleChain API] Record contribution failed:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

// 6. Fetch contributions for a circle
export async function fetchContributionsApi(circleId: number | string): Promise<ContributionData[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/${circleId}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.error(`[CircleChain API] Failed to fetch contributions for circle #${circleId}:`, err);
  }
  return [];
}

// 7. Release Pot Payout
export async function releasePayoutApi(payload: {
  circle_id: number;
  cycle_index: number;
  recipient_address: string;
  total_pot: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error || 'Failed to release pot' };
  } catch (err: any) {
    console.error('[CircleChain API] Release payout failed:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

// 8. Fetch User Profile from Prisma backend
export async function fetchUserProfileApi(walletAddress: string): Promise<UserProfileData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/profiles/${walletAddress}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.profile) return data.profile;
    }
  } catch (err) {
    console.error(`[CircleChain API] Backend unreachable for profile ${walletAddress}:`, err);
  }

  // Return clean default state for this wallet if not in DB yet
  return {
    wallet_address: walletAddress,
    display_name: `Saver (${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)})`,
    reputation_score: 100,
    circles_completed: 0,
    punctual_contributions: 0,
    total_collateral_staked: 0
  };
}

// 9. Save User Profile via Prisma backend
export async function saveUserProfileApi(profileData: UserProfileData): Promise<UserProfileData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.profile) return data.profile;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save profile');
    }
  } catch (err) {
    console.error('[CircleChain API] Backend profile save error:', err);
    throw err;
  }

  return profileData;
}
