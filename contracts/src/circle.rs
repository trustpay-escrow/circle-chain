use soroban_sdk::{symbol_short, token, Address, Env, Vec};
use crate::types::{
    Circle, CircleStatus, DataKey, Member, PayoutOrderMode, FORMING_EXPIRY_SECONDS,
    TTL_EXTEND_TO, TTL_THRESHOLD,
};

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

/// Cancels an unfilled circle in Forming state.
/// - The circle creator can cancel at any time.
/// - Any joined member can trigger cancellation after the 7-day inactivity window (FORMING_EXPIRY_SECONDS).
/// Automatically refunds all deposited collateral to joined members and sets status to Cancelled.
pub fn cancel_circle(env: &Env, circle_id: u64, caller: Address) {
    caller.require_auth();

    let circle_key = DataKey::Circle(circle_id);
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Forming {
        panic!("Circle is not in forming state");
    }

    let is_creator = caller == circle.creator;
    if !is_creator {
        // Non-creator must be a joined member
        let member_key = DataKey::Member(circle_id, caller.clone());
        if !env.storage().persistent().has(&member_key) {
            panic!("Caller not authorized to cancel circle");
        }

        // Must have passed inactivity / formation expiry window (7 days)
        let now = env.ledger().timestamp();
        if now < circle.cycle_start_time + FORMING_EXPIRY_SECONDS {
            panic!("Cancellation window not open yet for members");
        }
    }

    let members_key = DataKey::CircleMembers(circle_id);
    let members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&members_key)
        .unwrap_or(Vec::new(env));

    let token_client = token::Client::new(env, &circle.token_address);
    for m in members.iter() {
        let member_key = DataKey::Member(circle_id, m.clone());
        if let Some(mut member) = env.storage().persistent().get::<DataKey, Member>(&member_key) {
            let refund = member.collateral_deposited;
            if refund > 0 {
                member.collateral_deposited = 0;
                env.storage().persistent().set(&member_key, &member);
                env.storage().persistent().extend_ttl(&member_key, TTL_THRESHOLD, TTL_EXTEND_TO);
                token_client.transfer(&env.current_contract_address(), &m, &refund);
            }
        }
    }

    circle.status = CircleStatus::Cancelled;
    env.storage().persistent().set(&circle_key, &circle);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.events().publish(
        (symbol_short!("cancelled"), circle_id),
        (caller, members.len()),
    );
}
