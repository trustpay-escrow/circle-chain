use soroban_sdk::{Env, Address, Vec};
use crate::types::{Circle, CircleStatus, PayoutOrderMode, DataKey};

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
        token_address,
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

    env.storage().persistent().set(&DataKey::Circle(circle_count), &circle);
    env.storage().instance().set(&DataKey::CircleCount, &circle_count);

    circle_count
}

pub fn get_circle_status(env: &Env, circle_id: u64) -> Circle {
    env.storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found")
}
