import { supabase } from './supabase';

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
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  reputation_score?: number;
  circles_completed?: number;
  punctual_contributions?: number;
  total_collateral_staked?: number;
}

// 1. Fetch all savings circles
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
    console.warn('Backend server unavailable, falling back to Supabase direct client:', err);
  }

  // Fallback to Supabase direct client
  try {
    const { data, error } = await supabase
      .from('circles_metadata')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.error('Supabase fetch error:', e);
  }

  return [];
}

// 2. Fetch single circle by ID
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
    console.warn('Backend server unavailable, falling back to Supabase:', err);
  }

  // Fallback to Supabase direct client
  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const { data: circle } = await supabase
      .from('circles_metadata')
      .select('*')
      .eq('circle_id', numericId)
      .single();

    if (circle) {
      const { data: members } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', numericId);

      const { data: contributions } = await supabase
        .from('contributions')
        .select('*')
        .eq('circle_id', numericId);

      return {
        ...circle,
        members: members || [],
        contributions: contributions || []
      };
    }
  } catch (e) {
    console.error('Supabase circle detail fetch error:', e);
  }

  return null;
}

// 3. Create a new circle
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
    console.warn('Backend API unavailable, submitting directly to Supabase:', err);
  }

  // Fallback to Supabase direct client
  try {
    const circle_id = payload.circle_id || Date.now();
    const newCircle = {
      circle_id,
      name: payload.name,
      description: payload.description,
      creator_address: payload.creator_address,
      contribution_amount: payload.contribution_amount,
      interval_days: payload.interval_days,
      member_count: payload.member_count,
      collateral_required: payload.collateral_required,
      status: 'Forming',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('circles_metadata')
      .insert([newCircle])
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.error('Supabase direct insert error:', e);
  }

  return null;
}

// 4. Fetch User Profile
export async function fetchUserProfileApi(walletAddress: string): Promise<UserProfileData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/profiles/${walletAddress}`);
    if (res.ok) {
      const data = await res.json();
      if (data.profile) return data.profile;
    }
  } catch (err) {
    console.warn('Backend profile API unavailable, fetching from Supabase:', err);
  }

  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (data) return data;
  } catch (e) {
    console.error('Supabase profile fetch error:', e);
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

// 5. Save User Profile
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
    console.warn('Backend profile save error:', err);
  }

  try {
    const { data } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (data) return data;
  } catch (e) {
    console.error('Supabase profile save error:', e);
  }

  return null;
}
