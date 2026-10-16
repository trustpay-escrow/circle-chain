const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface CircleData {
  circle_id: number;
  name: string;
  description: string;
  category?: string;
  creator_address: string;
  contribution_amount: number;
  interval_days: number;
  member_count: number;
  collateral_required: number;
  payout_mode?: string;
  status: string;
  created_at?: string;
  members?: any[];
  contributions?: any[];
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

// Fallback circles for local client previews when backend is starting
const localFallbackCircles: CircleData[] = [
  {
    circle_id: 1,
    name: 'Tech Founders Ajo Pool',
    description: 'Monthly ROSCA savings pool for tech founders & developers in West Africa.',
    category: 'Business Investment',
    creator_address: 'GABC1234567890WXYZ1234567890TESTNETSAVER01',
    contribution_amount: 200,
    interval_days: 30,
    member_count: 5,
    collateral_required: 100,
    payout_mode: 'Fixed',
    status: 'Active',
    created_at: new Date().toISOString(),
    members: [],
    contributions: []
  },
  {
    circle_id: 2,
    name: 'Crypto Builders Weekly Pot',
    description: 'Weekly automated savings circle for Soroban smart contract developers.',
    category: 'DeFi Savings',
    creator_address: 'GBX98765432104K2L9876543210TESTNETSAVER02',
    contribution_amount: 50,
    interval_days: 7,
    member_count: 8,
    collateral_required: 25,
    payout_mode: 'Bidding',
    status: 'Forming',
    created_at: new Date().toISOString(),
    members: [],
    contributions: []
  }
];

// 1. Fetch all savings circles from Prisma backend
export async function fetchCircles(): Promise<CircleData[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles`);
    if (res.ok) {
      const data = await res.json();
      if (data.circles && Array.isArray(data.circles) && data.circles.length > 0) {
        return data.circles;
      }
    }
  } catch (err) {
    console.warn('[CircleChain API] Backend unreachable, returning local fallback preview:', err);
  }

  return localFallbackCircles;
}

// 2. Fetch single circle by ID from Prisma backend
export async function fetchCircleById(id: string): Promise<CircleData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.circle) {
        return data.circle;
      }
    }
  } catch (err) {
    console.warn(`[CircleChain API] Backend unreachable for circle #${id}:`, err);
  }

  const numericId = parseInt(id, 10);
  const found = localFallbackCircles.find((c) => c.circle_id === numericId);
  return found || localFallbackCircles[0];
}

// 3. Create a new circle via Prisma backend
export async function createCircleApi(payload: Omit<CircleData, 'circle_id' | 'status'> & { circle_id?: number }): Promise<CircleData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.circle) return data.circle;
    }
  } catch (err) {
    console.warn('[CircleChain API] Backend API offline during createCircle:', err);
  }

  const newCircle: CircleData = {
    circle_id: payload.circle_id || Date.now(),
    name: payload.name,
    description: payload.description,
    category: payload.category || 'General Savings',
    creator_address: payload.creator_address,
    contribution_amount: payload.contribution_amount,
    interval_days: payload.interval_days,
    member_count: payload.member_count,
    collateral_required: payload.collateral_required,
    payout_mode: payload.payout_mode || 'Fixed',
    status: 'Forming',
    created_at: new Date().toISOString()
  };

  localFallbackCircles.unshift(newCircle);
  return newCircle;
}

// 4. Fetch User Profile from Prisma backend
export async function fetchUserProfileApi(walletAddress: string): Promise<UserProfileData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/profiles/${walletAddress}`);
    if (res.ok) {
      const data = await res.json();
      if (data.profile) return data.profile;
    }
  } catch (err) {
    console.warn(`[CircleChain API] Backend unreachable for profile ${walletAddress}:`, err);
  }

  return {
    wallet_address: walletAddress,
    display_name: `Saver (${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)})`,
    reputation_score: 95,
    circles_completed: 0,
    punctual_contributions: 0,
    total_collateral_staked: 0
  };
}

// 5. Save User Profile via Prisma backend
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
    }
  } catch (err) {
    console.warn('[CircleChain API] Backend profile save error:', err);
  }

  return profileData;
}
