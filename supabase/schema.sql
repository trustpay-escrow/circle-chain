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
    token_address VARCHAR(64) DEFAULT 'USDC',
    contribution_amount NUMERIC(20, 7) NOT NULL DEFAULT 100,
    interval_days INT NOT NULL DEFAULT 7,
    member_count INT NOT NULL DEFAULT 5,
    collateral_required NUMERIC(20, 7) NOT NULL DEFAULT 50,
    payout_mode VARCHAR(50) DEFAULT 'Fixed',
    status VARCHAR(50) DEFAULT 'Forming', -- 'Forming', 'Active', 'Completed', 'Defaulted'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Off-Chain User Profiles & SBT Reputation Metrics
CREATE TABLE IF NOT EXISTS user_profiles (
    wallet_address VARCHAR(64) PRIMARY KEY, -- Stellar public key (G...)
    username VARCHAR(50) UNIQUE, -- Unique handle (@username)
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    email VARCHAR(255),
    reputation_score INT DEFAULT 90, -- Portable reputation score (0 - 100)
    circles_completed INT DEFAULT 0,
    punctual_contributions INT DEFAULT 0,
    total_collateral_staked NUMERIC(20, 7) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Circle Roster & Members Mapping
CREATE TABLE IF NOT EXISTS circle_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id BIGINT NOT NULL REFERENCES circles_metadata(circle_id) ON DELETE CASCADE,
    wallet_address VARCHAR(64) NOT NULL,
    collateral_staked NUMERIC(20, 7) DEFAULT 0,
    payout_received BOOLEAN DEFAULT FALSE,
    payout_order_index INT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(circle_id, wallet_address)
);

-- 4. Cycle Contribution Matrix & Payment Logs
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id BIGINT NOT NULL REFERENCES circles_metadata(circle_id) ON DELETE CASCADE,
    cycle_index INT NOT NULL,
    member_address VARCHAR(64) NOT NULL,
    amount NUMERIC(20, 7) NOT NULL,
    status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'pending', 'defaulted'
    tx_hash VARCHAR(128),
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Off-Chain Notifications Queue
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(64) NOT NULL,
    circle_id BIGINT NOT NULL REFERENCES circles_metadata(circle_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'contribution_due', 'payout_received', 'default_warning', 'circle_full'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reputation Audit Log
CREATE TABLE IF NOT EXISTS reputation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(64) NOT NULL,
    circle_id BIGINT REFERENCES circles_metadata(circle_id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'cycle_on_time', 'circle_completed', 'cycle_default'
    score_change INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_circles_creator ON circles_metadata(creator_address);
CREATE INDEX IF NOT EXISTS idx_circles_status ON circles_metadata(status);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_wallet ON circle_members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_contributions_circle_cycle ON contributions(circle_id, cycle_index);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet_address);
