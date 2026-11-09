use soroban_sdk::{symbol_short, Address, Env, Vec};
use crate::types::{Bid, Circle, CircleStatus, DataKey, Member, PayoutOrderMode, TTL_EXTEND_TO, TTL_THRESHOLD};

/// Submits an auction bid for the communal pot in BidBased mode.
/// Members who need the pot urgently bid a discount (e.g., willing to accept 90 USDC instead of 100 USDC).
/// The highest discount bidder wins the pot for that cycle, and the discounted surplus is distributed
/// as a dividend bonus to all other circle members.
pub fn submit_bid(
    env: &Env,
    circle_id: u64,
    cycle_index: u32,
    bidder: Address,
    discount_amount: i128,
) {
    bidder.require_auth();

    let circle_key = DataKey::Circle(circle_id);
    let circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    if circle.payout_order_mode != PayoutOrderMode::BidBased {
        panic!("Circle is not in BidBased auction mode");
    }

    if cycle_index != circle.current_cycle {
        panic!("Bids can only be submitted for the current cycle");
    }

    let member_key = DataKey::Member(circle_id, bidder.clone());
    let member: Member = env
        .storage()
        .persistent()
        .get(&member_key)
        .expect("Bidder is not a member of this circle");

    if member.has_received_payout {
        panic!("Member has already received a payout and cannot bid");
    }

    if member.reputation_score == 0 && member.collateral_deposited == 0 {
        panic!("Defaulter is disqualified from bidding");
    }

    let total_pot = circle.contribution_amount * (circle.member_count as i128);
    if discount_amount <= 0 || discount_amount >= total_pot {
        panic!("Discount amount must be greater than 0 and less than total pot");
    }

    let bids_key = DataKey::CycleBids(circle_id, cycle_index);
    let bids: Vec<Bid> = env
        .storage()
        .persistent()
        .get(&bids_key)
        .unwrap_or(Vec::new(env));

    let mut updated_bids = Vec::new(env);
    let mut updated = false;

    for b in bids.iter() {
        if b.bidder == bidder {
            // Update existing bid for this member
            updated_bids.push_back(Bid {
                bidder: bidder.clone(),
                discount_amount,
                timestamp: env.ledger().timestamp(),
            });
            updated = true;
        } else {
            updated_bids.push_back(b);
        }
    }

    if !updated {
        updated_bids.push_back(Bid {
            bidder: bidder.clone(),
            discount_amount,
            timestamp: env.ledger().timestamp(),
        });
    }

    env.storage().persistent().set(&bids_key, &updated_bids);
    env.storage().persistent().extend_ttl(&bids_key, TTL_THRESHOLD, TTL_EXTEND_TO);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    // Emit auction bid event
    env.events().publish(
        (symbol_short!("bid"), circle_id),
        (bidder, cycle_index, discount_amount),
    );
}

/// Retrieves all bids submitted for a specific cycle in BidBased mode
pub fn get_cycle_bids(env: &Env, circle_id: u64, cycle_index: u32) -> Vec<Bid> {
    let bids_key = DataKey::CycleBids(circle_id, cycle_index);
    env.storage()
        .persistent()
        .get(&bids_key)
        .unwrap_or(Vec::new(env))
}
