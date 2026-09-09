use soroban_sdk::{Env, Address, token, Vec};
use crate::types::{Circle, CircleStatus, Member, DataKey, DEFAULT_GRACE_PERIOD_SECONDS};

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

    let paid_members: Vec<Address> = env
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

    // Slash collateral
    let slashed_amount = member.collateral_deposited;
    member.collateral_deposited = 0;
    member.reputation_score = 0; // Reset reputation score on default

    circle.status = CircleStatus::Defaulted;

    env.storage().persistent().set(&DataKey::Member(circle_id, defaulter.clone()), &member);
    env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);

    // TODO: DESIGN DECISION FOR USER
    // How should slashed collateral be distributed?
    // Option A: Kept in contract vault to cover missing contributions.
    // Option B: Distributed pro-rata to non-defaulting members.
}

pub fn withdraw_collateral(env: &Env, circle_id: u64, member_address: Address) {
    member_address.require_auth();

    let circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    if circle.status != CircleStatus::Completed {
        panic!("Circle is not completed");
    }

    let mut member: Member = env
        .storage()
        .persistent()
        .get(&DataKey::Member(circle_id, member_address.clone()))
        .expect("Member not found");

    if member.collateral_deposited <= 0 {
        panic!("No collateral to withdraw");
    }

    let amount = member.collateral_deposited;
    member.collateral_deposited = 0;

    let client = token::Client::new(env, &circle.token_address);
    client.transfer(&env.current_contract_address(), &member_address, &amount);

    env.storage().persistent().set(&DataKey::Member(circle_id, member_address), &member);
}
