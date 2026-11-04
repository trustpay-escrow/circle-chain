use soroban_sdk::{Env, Address, token, Vec};
use crate::types::{Circle, CircleStatus, Member, DataKey, DEFAULT_GRACE_PERIOD_SECONDS};

/// Slashes collateral of a member who defaults on their cycle contribution after the deadline and grace period.
/// If sufficient collateral is available, liquidates the deficit directly into the current cycle pot,
/// keeping the circle active so honest members can receive their scheduled payout.
/// If collateral is insufficient, transitions the circle to Defaulted for emergency unwinding.
pub fn handle_default(env: &Env, circle_id: u64, defaulter: Address) {
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    let deadline = circle.cycle_start_time + circle.interval + DEFAULT_GRACE_PERIOD_SECONDS;
    if env.ledger().timestamp() < deadline {
        panic!("Cycle deadline and grace period have not expired yet");
    }

    let mut paid_members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&DataKey::CycleContributions(circle_id, circle.current_cycle))
        .unwrap_or(Vec::new(env));

    // Ensure member has NOT contributed
    for paid in paid_members.iter() {
        if paid == defaulter {
            panic!("Member has already contributed for this cycle");
        }
    }

    let mut member: Member = env
        .storage()
        .persistent()
        .get(&DataKey::Member(circle_id, defaulter.clone()))
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
    } else {
        // Active Liquidation and Deficit Coverage Engine:
        // Slash defaulter's collateral (100% forfeiture) and reset reputation score
        member.collateral_deposited = 0;
        member.reputation_score = 0;

        // Credit defaulter's share into the current cycle's pot using the liquidated collateral
        paid_members.push_back(defaulter.clone());
        env.storage().persistent().set(
            &DataKey::CycleContributions(circle_id, circle.current_cycle),
            &paid_members,
        );

        // Circle remains Active so check_and_release_payout can complete the round!
    }

    env.storage().persistent().set(&DataKey::Member(circle_id, defaulter), &member);
    env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);
}

/// Initiates emergency unwind of a defaulted or stalled circle, transitioning it to Terminated
/// so non-defaulting members can safely withdraw their deposited collateral and unreleased contributions.
pub fn emergency_unwind(env: &Env, circle_id: u64) {
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    let deadline = circle.cycle_start_time + circle.interval + DEFAULT_GRACE_PERIOD_SECONDS;
    let is_stalled = circle.status == CircleStatus::Active && env.ledger().timestamp() >= deadline;

    if circle.status != CircleStatus::Defaulted && !is_stalled {
        panic!("Circle cannot be emergency unwound at this stage");
    }

    circle.status = CircleStatus::Terminated;
    env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);
}

/// Withdraws staked collateral and/or emergency refund upon completion or termination of a circle.
pub fn withdraw_collateral(env: &Env, circle_id: u64, member_address: Address) {
    member_address.require_auth();

    let circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    if circle.status != CircleStatus::Completed && circle.status != CircleStatus::Terminated {
        panic!("Circle is not completed or terminated");
    }

    let mut member: Member = env
        .storage()
        .persistent()
        .get(&DataKey::Member(circle_id, member_address.clone()))
        .expect("Member not found");

    let mut total_refund = member.collateral_deposited;
    member.collateral_deposited = 0;

    // In a terminated circle, also refund any contribution deposited for the uncompleted cycle
    if circle.status == CircleStatus::Terminated && !member.has_received_payout {
        let paid_members: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::CycleContributions(circle_id, circle.current_cycle))
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

    env.storage().persistent().set(&DataKey::Member(circle_id, member_address), &member);
}
