use soroban_sdk::{symbol_short, token, Address, Env, Vec};
use crate::types::{
    Circle, CircleStatus, DataKey, Member, DEFAULT_GRACE_PERIOD_SECONDS, TTL_EXTEND_TO,
    TTL_THRESHOLD,
};

/// Slashes collateral of a member who defaults on their cycle contribution after the deadline and grace period.
/// If sufficient collateral is available, liquidates the deficit directly into the current cycle pot,
/// keeping the circle active so honest members can receive their scheduled payout.
/// If collateral is insufficient, transitions the circle to Defaulted for emergency unwinding.
pub fn handle_default(env: &Env, circle_id: u64, defaulter: Address) {
    let circle_key = DataKey::Circle(circle_id);
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    let deadline = circle.cycle_start_time + circle.interval + DEFAULT_GRACE_PERIOD_SECONDS;
    if env.ledger().timestamp() < deadline {
        panic!("Cycle deadline and grace period have not expired yet");
    }

    let cycle_key = DataKey::CycleContributions(circle_id, circle.current_cycle);
    let mut paid_members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&cycle_key)
        .unwrap_or(Vec::new(env));

    // Ensure member has NOT contributed
    for paid in paid_members.iter() {
        if paid == defaulter {
            panic!("Member has already contributed for this cycle");
        }
    }

    let member_key = DataKey::Member(circle_id, defaulter.clone());
    let mut member: Member = env
        .storage()
        .persistent()
        .get(&member_key)
        .expect("Member not found");

    if member.collateral_deposited <= 0 {
        panic!("No collateral available to slash");
    }

    let required_contribution = circle.contribution_amount;

    if member.collateral_deposited < required_contribution {
        // Collateral is insufficient to cover the pot deficit.
        // Slash whatever remains and mark the circle as Defaulted so emergency_unwind can be triggered.
        member.collateral_deposited = 0;
        member.reputation_score = 0;
        circle.status = CircleStatus::Defaulted;

        env.events().publish(
            (symbol_short!("defaulted"), circle_id),
            (defaulter.clone(), circle.current_cycle, required_contribution),
        );
    } else {
        // Active Liquidation and Deficit Coverage Engine:
        // Slash defaulter's collateral (100% forfeiture) and reset reputation score
        member.collateral_deposited = 0;
        member.reputation_score = 0;

        // Credit defaulter's share into the current cycle's pot using the liquidated collateral
        paid_members.push_back(defaulter.clone());
        env.storage().persistent().set(&cycle_key, &paid_members);
        env.storage().persistent().extend_ttl(&cycle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

        env.events().publish(
            (symbol_short!("slashed"), circle_id),
            (defaulter.clone(), required_contribution, circle.current_cycle),
        );
        // Circle remains Active so check_and_release_payout can complete the round!
    }

    env.storage().persistent().set(&member_key, &member);
    env.storage().persistent().extend_ttl(&member_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.storage().persistent().set(&circle_key, &circle);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

/// Initiates emergency unwind of a defaulted or stalled circle, transitioning it to Terminated
/// so non-defaulting members can safely withdraw their deposited collateral and unreleased contributions.
pub fn emergency_unwind(env: &Env, circle_id: u64) {
    let circle_key = DataKey::Circle(circle_id);
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    let deadline = circle.cycle_start_time + circle.interval + DEFAULT_GRACE_PERIOD_SECONDS;
    let is_stalled = circle.status == CircleStatus::Active && env.ledger().timestamp() >= deadline;

    if circle.status != CircleStatus::Defaulted && !is_stalled {
        panic!("Circle cannot be emergency unwound at this stage");
    }

    circle.status = CircleStatus::Terminated;
    env.storage().persistent().set(&circle_key, &circle);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.events().publish(
        (symbol_short!("unwound"), circle_id),
        (circle.current_cycle,),
    );
}

/// Withdraws staked collateral and/or emergency refund upon completion or termination of a circle.
pub fn withdraw_collateral(env: &Env, circle_id: u64, member_address: Address) {
    member_address.require_auth();

    let circle_key = DataKey::Circle(circle_id);
    let circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Completed && circle.status != CircleStatus::Terminated {
        panic!("Circle is not completed or terminated");
    }

    let member_key = DataKey::Member(circle_id, member_address.clone());
    let mut member: Member = env
        .storage()
        .persistent()
        .get(&member_key)
        .expect("Member not found");

    let mut total_refund = member.collateral_deposited;
    member.collateral_deposited = 0;

    // In a terminated circle, also refund any contribution deposited for the uncompleted cycle
    if circle.status == CircleStatus::Terminated && !member.has_received_payout {
        let cycle_key = DataKey::CycleContributions(circle_id, circle.current_cycle);
        let paid_members: Vec<Address> = env
            .storage()
            .persistent()
            .get(&cycle_key)
            .unwrap_or(Vec::new(env));

        for paid in paid_members.iter() {
            if paid == member_address {
                total_refund += circle.contribution_amount;
                break;
            }
        }
    }

    if total_refund <= 0 {
        panic!("No funds available to withdraw");
    }

    let client = token::Client::new(env, &circle.token_address);
    client.transfer(&env.current_contract_address(), &member_address, &total_refund);

    env.storage().persistent().set(&member_key, &member);
    env.storage().persistent().extend_ttl(&member_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.events().publish(
        (symbol_short!("withdrawn"), circle_id),
        (member_address, total_refund),
    );
}
