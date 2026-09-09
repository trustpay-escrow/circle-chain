use soroban_sdk::{Env, Address, Vec, token};
use crate::types::{Circle, CircleStatus, DataKey};

pub fn contribute(env: &Env, circle_id: u64, member_address: Address, amount: i128) {
    member_address.require_auth();

    let circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    if amount != circle.contribution_amount {
        panic!("Contribution amount does not match circle requirement");
    }

    let mut paid_members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&DataKey::CycleContributions(circle_id, circle.current_cycle))
        .unwrap_or(Vec::new(env));

    // Prevent duplicate contributions in the same cycle
    for paid in paid_members.iter() {
        if paid == member_address {
            panic!("Member already contributed for this cycle");
        }
    }

    // Transfer contribution to contract vault
    let client = token::Client::new(env, &circle.token_address);
    client.transfer(&member_address, &env.current_contract_address(), &amount);

    paid_members.push_back(member_address);
    env.storage().persistent().set(
        &DataKey::CycleContributions(circle_id, circle.current_cycle),
        &paid_members,
    );
}

pub fn check_and_release_payout(env: &Env, circle_id: u64) {
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    let paid_members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&DataKey::CycleContributions(circle_id, circle.current_cycle))
        .unwrap_or(Vec::new(env));

    if paid_members.len() < circle.member_count {
        panic!("Not all members have contributed for the current cycle");
    }

    let recipient = circle.payout_schedule.get(circle.current_cycle).expect("Invalid recipient schedule");

    let total_payout = circle.contribution_amount * (circle.member_count as i128);

    // Transfer pot to recipient
    let client = token::Client::new(env, &circle.token_address);
    client.transfer(&env.current_contract_address(), &recipient, &total_payout);

    // Mark recipient as paid out
    let mut member = env
        .storage()
        .persistent()
        .get(&DataKey::Member(circle_id, recipient.clone()))
        .expect("Member not found");
    member.has_received_payout = true;
    env.storage().persistent().set(&DataKey::Member(circle_id, recipient), &member);

    // Advance cycle or complete circle
    if circle.current_cycle + 1 >= circle.member_count {
        circle.status = CircleStatus::Completed;
    } else {
        circle.current_cycle += 1;
        circle.cycle_start_time = env.ledger().timestamp();
    }

    env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);
}
