use soroban_sdk::{symbol_short, Address, Env, Vec};
use crate::types::{Circle, CircleStatus, DataKey, PayoutOrderMode, TTL_EXTEND_TO, TTL_THRESHOLD};

pub fn create_circle(
    env: &Env,
    creator: Address,
    token_address: Address,
    contribution_amount: i128,
    interval: u64,
    member_count: u32,
    collateral_required: i128,
    payout_schedule: Vec<Address>,
) -> u64 {
    creator.require_auth();

    let mut circle_count: u64 = env
        .storage()
        .instance()
        .get(&DataKey::CircleCount)
        .unwrap_or(0);

    circle_count += 1;

    let circle = Circle {
        id: circle_count,
        creator: creator.clone(),
        token_address: token_address.clone(),
        contribution_amount,
        interval,
        member_count,
        payout_order_mode: PayoutOrderMode::Fixed,
        collateral_required,
        current_cycle: 0,
        cycle_start_time: env.ledger().timestamp(),
        status: CircleStatus::Forming,
        payout_schedule,
    };

    let circle_key = DataKey::Circle(circle_count);
    env.storage().persistent().set(&circle_key, &circle);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.storage().instance().set(&DataKey::CircleCount, &circle_count);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);

    // Emit Soroban event for circle creation
    env.events().publish(
        (symbol_short!("created"), circle_count),
        (creator, token_address, contribution_amount, member_count, interval),
    );

    circle_count
}

pub fn get_circle_status(env: &Env, circle_id: u64) -> Circle {
    let circle_key = DataKey::Circle(circle_id);
    let circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    circle
}
