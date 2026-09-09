-- CircleChain Supabase Off-Chain Schema
-- STRICT ARCHITECTURAL PRINCIPLE:
-- This database stores purely descriptive, non-custodial metadata (circle names, descriptions, member avatars, UI history, notifications).
-- IT CAN NEVER HOLD PRIVATE KEYS, AUTHORIZE FUND TRANSFERS, OR CONTROL ON-CHAIN STATE.

-- 1. Descriptive Metadata for Circles
CREATE TABLE IF NOT EXISTS circles_metadata (
    circle_id BIGINT PRIMARY KEY, -- Corresponds directly to Soroban circle_id (u64)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'General Savings',
    creator_address VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Off-Chain User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    wallet_address VARCHAR(64) PRIMARY KEY, -- Stellar public key
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Off-Chain Notifications Queue
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(64) NOT NULL,
    circle_id BIGINT NOT NULL REFERENCES circles_metadata(circle_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'contribution_due', 'payout_received', 'default_warning'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_circles_creator ON circles_metadata(creator_address);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet_address);
